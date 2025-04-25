const express = require('express');
const router = express.Router();
const User = require('../models/User');
const TelegramUser = require('../models/TelegramUser');
const authMiddleware = require('../middleware/authMiddleware');

// Получить всех пользователей
router.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Обновить информацию о пользователе
router.patch('/users/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;

        // Проверяем, что пользователь обновляет свой профиль
        if (userId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Вы можете редактировать только свой профиль' });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Проверка подключения Telegram-бота
router.get('/check-telegram-user', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const telegramUser = await TelegramUser.findOne({ userId });

        if (!telegramUser) {
            // Здесь должна быть логика генерации ссылки на бота, например:
            const botLink = `https://t.me/YourStylistBot?start=${userId}`; // Пример ссылки
            return res.json({ isRegistered: false, botLink });
        }

        res.json({ isRegistered: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;