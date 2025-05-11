const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const authMiddleware = require('../middleware/authMiddleware');

const Config = {
    HEYGEN_API_KEY: process.env.HEYGEN_API_KEY,
    API_BASE_URL: 'https://api.heygen.com',
    VIDEO_ENDPOINT_GENERATE: '/v2/video/generate',
};

const request = require('request');

async function generateVideoWithHeyGen(text, avatarId, voiceId) {
    const headers = {
        'X-Api-Key': Config.HEYGEN_API_KEY,
        'Content-Type': 'application/json',
    };
    const payload = {
        video_inputs: [{
            character: { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' },
            voice: { type: 'text', input_text: text, voice_id: voiceId || 'ydpaLlup5FP73DE3Z3JJ' },
            background: { type: 'color', value: '#ffffff' },
        }],
        dimension: { width: 720, height: 1080 },
    };

    try {
        console.log('Sending payload to HeyGen:', JSON.stringify(payload));
        const response = await new Promise((resolve, reject) => {
            request.post({
                url: `${Config.API_BASE_URL}${Config.VIDEO_ENDPOINT_GENERATE}`,
                headers,
                json: payload,
                timeout: 30000,
            }, (error, res, body) => {
                console.log('HeyGen response:', res?.statusCode, body);
                if (error) reject(error);
                else resolve({ statusCode: res.statusCode, body });
            });
        });

        if (response.statusCode !== 200) {
            throw new Error(`HTTP Error ${response.statusCode}: ${JSON.stringify(response.body)}`);
        }

        const data = response.body;
        if (data.data && data.data.video_id) {
            return { status: 'processing', video_id: data.data.video_id };
        }
        return { status: 'error', error: 'Invalid API response: ' + JSON.stringify(data) };
    } catch (error) {
        console.error('HeyGen error:', error.message);
        return { status: 'error', error: error.message };
    }
}

async function pollVideoStatus(videoId) {
    const headers = {
        'X-Api-Key': Config.HEYGEN_API_KEY,
    };
    const maxAttempts = 18;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
            const response = await new Promise((resolve, reject) => {
                request.get({
                    url: `${Config.API_BASE_URL}/v1/video_status.get`,
                    headers,
                    qs: { video_id: videoId },
                    timeout: 15000,
                }, (error, res, body) => {
                    if (error) reject(error);
                    else resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
                });
            });

            if (response.statusCode !== 200) {
                console.error(`Status check HTTP error: ${response.statusCode}`);
                continue;
            }

            const statusData = response.body;
            if (statusData.code === 100 && statusData.data && statusData.data.status === 'completed') {
                return statusData.data.video_url;
            } else if (statusData.data && statusData.data.status === 'failed') {
                console.error(`Video generation failed: ${statusData.data.error}`);
                return null;
            }
        } catch (error) {
            console.error(`Status check error: ${error.message}`);
        }
    }
    console.error('Video generation timeout');
    return null;
}

router.post('/stories', authMiddleware, async (req, res) => {
    const { stylistId, text, avatarId, voiceId } = req.body;

    try {
        if (!stylistId || !text || !avatarId) {
            return res.status(400).json({ message: 'Missing required fields: stylistId, text, or avatarId' });
        }

        const generationResult = await generateVideoWithHeyGen(text, avatarId, voiceId);
        if (generationResult.status === 'error') {
            return res.status(400).json({ message: generationResult.error });
        }

        const videoId = generationResult.video_id;
        const videoUrl = await pollVideoStatus(videoId);

        if (!videoUrl) {
            return res.status(500).json({ message: 'Failed to generate video after polling' });
        }

        const story = new Story({
            stylistId,
            videoUrl,
            text,
            avatarId,
        });
        await story.save();

        res.status(201).json(story);
    } catch (error) {
        console.error('Error in /stories route:', error);
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
});

router.get('/stylists/:stylistId/stories', async (req, res) => {
    try {
        const stories = await Story.find({ stylistId: req.params.stylistId }).sort({ createdAt: -1 });
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;