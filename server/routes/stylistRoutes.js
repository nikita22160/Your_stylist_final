const express = require('express');
const router = express.Router();
const Stylist = require('../models/Stylist');
const Appointment = require('../models/Appointment');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

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

// Создать нового стилиста
router.post('/stylists', async (req, res) => {
    try {
        const stylist = new Stylist(req.body);
        await stylist.save();
        res.status(201).json(stylist);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Получить всех стилистов
router.get('/stylists', async (req, res) => {
    try {
        const stylists = await Stylist.find();
        res.json(stylists);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Получить стилиста по ID
router.get('/stylists/:id', async (req, res) => {
    try {
        const stylist = await Stylist.findById(req.params.id);
        if (!stylist) {
            return res.status(404).json({ message: 'Стилист не найден' });
        }
        res.json(stylist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Получить все записи стилиста
router.get('/stylists/:id/appointments', authenticateToken, async (req, res) => {
    try {
        const stylist = await Stylist.findById(req.params.id);
        if (!stylist) {
            return res.status(404).json({ message: 'Стилист не найден' });
        }

        let query = { stylistId: req.params.id };
        // Если пользователь — не стилист, показываем только его записи
        if (stylist.phone !== req.user.phone) {
            query.userId = req.user._id;
        }

        const appointments = await Appointment.find(query).populate('userId');
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Создать новую запись
router.post('/stylists/:id/appointments', authenticateToken, async (req, res) => {
    try {
        const { userId, date, time } = req.body;
        const stylistId = req.params.id;

        // Проверяем, что userId совпадает с _id пользователя из токена
        if (userId !== req.user._id) {
            return res.status(403).json({ message: 'Unauthorized: You can only book appointments for yourself' });
        }

        // Проверяем, существует ли такая запись
        const existingAppointment = await Appointment.findOne({
            stylistId,
            date: new Date(date).setHours(0, 0, 0, 0),
            time,
        });
        if (existingAppointment) {
            return res.status(400).json({ message: 'Это время уже занято' });
        }

        const appointment = new Appointment({
            stylistId,
            userId,
            date,
            time,
        });
        await appointment.save();

        // Популируем данные пользователя перед отправкой ответа
        const populatedAppointment = await Appointment.findById(appointment._id).populate('userId');
        res.status(201).json(populatedAppointment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Удалить запись
router.delete('/stylists/:id/appointments/:appointmentId', authenticateToken, async (req, res) => {
    try {
        const { id, appointmentId } = req.params;

        // Проверяем, что стилист существует
        const stylist = await Stylist.findById(id);
        if (!stylist) {
            return res.status(404).json({ message: 'Стилист не найден' });
        }

        // Проверяем, что пользователь — это стилист
        if (stylist.phone !== req.user.phone) {
            return res.status(403).json({ message: 'Unauthorized: You are not this stylist' });
        }

        // Находим запись
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Запись не найдена' });
        }

        // Проверяем, что запись принадлежит этому стилисту
        if (appointment.stylistId.toString() !== id) {
            return res.status(403).json({ message: 'Unauthorized: This appointment does not belong to this stylist' });
        }

        // Удаляем запись
        await Appointment.deleteOne({ _id: appointmentId });
        res.json({ message: 'Запись успешно удалена' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;