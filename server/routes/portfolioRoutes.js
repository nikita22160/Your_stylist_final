const express = require('express');
const router = express.Router();
const Stylist = require('../models/Stylist');
const PortfolioPost = require('../models/PortfolioPost');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Middleware для аутентификации
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid token' });
    }
};

// Эндпоинт для создания поста в портфолио
router.post('/stylists/:id/portfolio', authenticateToken, upload.array('photos', 10), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, hashtags } = req.body;

        // Проверяем, что стилист существует
        const stylist = await Stylist.findById(id);
        if (!stylist) {
            return res.status(404).json({ message: 'Stylist not found' });
        }

        // Проверяем, что пользователь — это стилист (по номеру телефона)
        const user = req.user;
        if (!user || stylist.phone !== user.phone) {
            return res.status(403).json({ message: 'Unauthorized: You are not this stylist' });
        }

        // Загружаем фотографии в Cloudinary
        const photoUrls = [];
        for (const file of req.files) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: `stylist_portfolio/${id}` },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(file.buffer);
            });
            photoUrls.push(result.secure_url);
        }

        // Создаём новый пост
        const newPost = new PortfolioPost({
            stylistId: id,
            title,
            description,
            photos: photoUrls,
            hashtags: hashtags ? hashtags.split(',').map((tag) => tag.trim()) : [],
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Эндпоинт для получения постов стилиста
router.get('/stylists/:id/portfolio', async (req, res) => {
    try {
        const { id } = req.params;
        const { search } = req.query;

        let query = { stylistId: id };
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { hashtags: searchRegex },
            ];
        }

        const posts = await PortfolioPost.find(query).sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Эндпоинт для редактирования поста
router.put('/stylists/:id/portfolio/:postId', authenticateToken, upload.array('photos', 10), async (req, res) => {
    try {
        const { id, postId } = req.params;
        const { title, description, hashtags, existingPhotos } = req.body;

        const stylist = await Stylist.findById(id);
        if (!stylist) {
            return res.status(404).json({ message: 'Stylist not found' });
        }

        const user = req.user;
        if (!user || stylist.phone !== user.phone) {
            return res.status(403).json({ message: 'Unauthorized: You are not this stylist' });
        }

        const post = await PortfolioPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.title = title;
        post.description = description;
        post.hashtags = hashtags ? hashtags.split(',').map((tag) => tag.trim()) : [];

        // Сохраняем существующие фотографии
        let updatedPhotos = existingPhotos ? JSON.parse(existingPhotos) : post.photos;

        // Если есть новые файлы, загружаем их
        if (req.files && req.files.length > 0) {
            const photoUrls = [];
            for (const file of req.files) {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: `stylist_portfolio/${id}` },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(file.buffer);
                });
                photoUrls.push(result.secure_url);
            }
            // Добавляем новые фотографии к существующим
            post.photos = [...updatedPhotos, ...photoUrls];
        } else {
            post.photos = updatedPhotos;
        }

        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Эндпоинт для удаления поста
router.delete('/stylists/:id/portfolio/:postId', authenticateToken, async (req, res) => {
    try {
        const { id, postId } = req.params;

        // Проверяем, что стилист существует
        const stylist = await Stylist.findById(id);
        if (!stylist) {
            return res.status(404).json({ message: 'Stylist not found' });
        }

        // Проверяем, что пользователь — это стилист
        const user = req.user;
        if (!user || stylist.phone !== user.phone) {
            return res.status(403).json({ message: 'Unauthorized: You are not this stylist' });
        }

        // Находим и удаляем пост
        const post = await PortfolioPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        await PortfolioPost.deleteOne({ _id: postId });
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;