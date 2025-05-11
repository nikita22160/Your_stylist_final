const express = require('express');
const connectDB = require('./db');
const userRoutes = require('./routes/userRoutes');
const stylistRoutes = require('./routes/stylistRoutes');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/portfolioRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const storyRoutes = require('./routes/storyRoutes'); // Новый маршрут
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const cron = require('node-cron');
const Appointment = require('./models/Appointment');
const Stylist = require('./models/Stylist');
const TelegramUser = require('./models/TelegramUser');
const { sendNotification } = require('./telegramBot');

const app = express();

// Загружаем переменные окружения
dotenv.config();

// Настройка Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const request = require('request');

const Config = {
    HEYGEN_API_KEY: process.env.HEYGEN_API_KEY,
    API_BASE_URL: 'https://api.heygen.com',
    VIDEO_ENDPOINT_GENERATE: '/v2/video/generate',
};

async function generateVideoWithHeyGen(text, avatarId) {
    const headers = {
        'X-Api-Key': Config.HEYGEN_API_KEY,
        'Content-Type': 'application/json',
    };
    const payload = {
        video_inputs: [{
            character: { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' },
            voice: { type: 'text', input_text: text, voice_id: '0011dfc1f6f544f1b8a6988489d6bf47' },
            background: { type: 'color', value: '#ffffff' },
        }],
        dimension: { width: 1280, height: 720 },
    };

    try {
        const response = await new Promise((resolve, reject) => {
            request.post({
                url: `${Config.API_BASE_URL}${Config.VIDEO_ENDPOINT_GENERATE}`,
                headers,
                json: payload,
                timeout: 30000,
            }, (error, res, body) => {
                if (error) reject(error);
                else resolve({ statusCode: res.statusCode, body });
            });
        });

        if (response.statusCode !== 200) {
            throw new Error(`HTTP Error ${response.statusCode}`);
        }

        const data = response.body;
        if (data.data && data.data.video_id) {
            return { status: 'processing', video_id: data.data.video_id };
        }
        return { status: 'error', error: 'Invalid API response' };
    } catch (error) {
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

// Подключаемся к MongoDB
connectDB();

app.use(express.json());

app.use('/api', userRoutes);
app.use('/api', stylistRoutes);
app.use('/api', authRoutes);
app.use('/api', postRoutes);
app.use('/api', reviewRoutes);
app.use('/api', storyRoutes); // Подключаем маршруты для сторис

app.get('/', (req, res) => {
    res.send('Welcome to the Stylist API');
});

// Планировщик задач для напоминаний за день
cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);

        const appointments = await Appointment.find({
            date: {
                $gte: tomorrow,
                $lte: tomorrowEnd,
            },
            status: 'Подтверждена',
        }).populate('userId').populate('stylistId');

        for (const appointment of appointments) {
            const userId = appointment.userId._id;
            const stylistId = appointment.stylistId._id;
            const appointmentDate = new Date(appointment.date).toLocaleDateString('ru-RU');

            const userName = `${appointment.userId.name} ${appointment.userId.surname}`;
            const userPhone = appointment.userId.phone;
            const stylistName = `${appointment.stylistId.name} ${appointment.stylistId.surname}`;
            const stylistPhone = appointment.stylistId.phone;
            const stylistChatLink = appointment.stylistId.chatLink || 'Свяжитесь через сайт';

            const userTelegram = await TelegramUser.findOne({ userId });
            const stylistTelegram = await TelegramUser.findOne({ userId: stylistId });

            const userChatLink = userTelegram && userTelegram.username ? `https://t.me/${userTelegram.username.replace('@', '')}` : 'Свяжитесь через сайт';

            if (userTelegram) {
                const userMessage = `Напоминание: у вас запись к стилисту ${stylistName} на ${appointmentDate} в ${appointment.time}.\n📞 Телефон стилиста: ${stylistPhone}\n💬 Связаться: ${stylistChatLink}`;
                await sendNotification(userTelegram.chatId, userMessage);
            }

            if (stylistTelegram) {
                const stylistMessage = `Напоминание: к вам запись от клиента ${userName} на ${appointmentDate} в ${appointment.time}.\n📞 Телефон клиента: ${userPhone}\n💬 Связаться: ${userChatLink}`;
                await sendNotification(stylistTelegram.chatId, stylistMessage);
            }
        }
    } catch (error) {
        console.error('Ошибка в планировщике напоминаний:', error.message);
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});