const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Создать нового пользователя
router.post('/users', async (req, res) => {
    try {
        const { phone } = req.body;

        // Проверяем, существует ли пользователь с таким номером телефона
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким номером телефона уже зарегистрирован!' });
        }

        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        // Обрабатываем ошибку дубликата от MongoDB
        if (error.code === 11000 && error.keyPattern.phone) {
            return res.status(400).json({ message: 'Пользователь с таким номером телефона уже зарегистрирован!' });
        }
        res.status(400).json({ message: error.message });
    }
});

// Получить всех пользователей
router.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;