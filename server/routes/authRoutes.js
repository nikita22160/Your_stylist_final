const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

router.post('/signup', async (req, res) => {
    try {
        const { name, surname, phone, password } = req.body;

        // Проверяем, существует ли пользователь с таким номером телефона
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким номером телефона уже зарегистрирован!' });
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            surname,
            phone,
            password: hashedPassword,
        });
        await user.save();

        // Генерируем JWT-токен
        const token = jwt.sign({ _id: user._id, phone: user.phone }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(201).json({ token, user: { _id: user._id, name: user.name, surname: user.surname, phone: user.phone } });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern.phone) {
            return res.status(400).json({ message: 'Пользователь с таким номером телефона уже зарегистрирован!' });
        }
        res.status(400).json({ message: error.message });
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { phone, password } = req.body;

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: 'Пользователь с таким номером телефона не найден' });
        }

        // Проверяем пароль
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверный пароль' });
        }

        // Генерируем JWT-токен
        const token = jwt.sign({ _id: user._id, phone: user.phone }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({ token, user: { _id: user._id, name: user.name, surname: user.surname, phone: user.phone } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;