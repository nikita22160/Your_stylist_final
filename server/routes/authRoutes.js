const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/signin', async (req, res) => {
    try {
        const { phone, password } = req.body;

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: 'Пользователь с таким номером телефона не найден' });
        }

        // Простая проверка пароля (в реальном проекте используй bcrypt для хеширования)
        if (user.password !== password) {
            return res.status(400).json({ message: 'Неверный пароль' });
        }

        res.json({ user: { name: user.name, surname: user.surname, phone: user.phone } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;