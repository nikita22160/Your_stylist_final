const express = require('express');
const router = express.Router();
const Stylist = require('../models/Stylist');
const Appointment = require('../models/Appointment');

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
router.get('/stylists/:id/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find({ stylistId: req.params.id });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Создать новую запись
router.post('/stylists/:id/appointments', async (req, res) => {
    try {
        const { userId, date, time } = req.body;
        const stylistId = req.params.id;

        // Проверяем, существует ли такая запись
        const existingAppointment = await Appointment.findOne({
            stylistId,
            date: new Date(date).setHours(0, 0, 0, 0), // Сравниваем только дату без времени
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
        res.status(201).json(appointment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;