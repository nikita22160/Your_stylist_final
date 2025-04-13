const express = require('express');
const router = express.Router();
const Stylist = require('../models/Stylist');
const Appointment = require('../models/Appointment');
const TelegramUser = require('../models/TelegramUser');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { sendNotification } = require('../telegramBot');

dotenv.config();

// Функция для нормализации номера телефона
const normalizePhone = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('+') ? digits : `+${digits}`;
};

// Middleware для аутентификации
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid token' });
    }
};

// Создать нового стилиста
router.post('/stylists', async (req, res) => {
    try {
        const { name, surname, phone, city, description, photoLink, chatLink } = req.body;

        // Нормализуем номер телефона
        const normalizedPhone = normalizePhone(phone);

        const stylist = new Stylist({
            name,
            surname,
            phone: normalizedPhone,
            city,
            description,
            photoLink,
            chatLink,
        });
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
        if (normalizePhone(stylist.phone) !== normalizePhone(req.user.phone) || req.user.role !== 'stylist') {
            query.userId = req.user._id;
        }

        const appointments = await Appointment.find(query).populate('userId').populate('stylistId');
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Новый маршрут: Получить все записи текущего пользователя
router.get('/appointments/user', authenticateToken, async (req, res) => {
    try {
        const appointments = await Appointment.find({ userId: req.user._id })
            .populate('userId')
            .populate('stylistId');
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Проверка, зарегистрирован ли пользователь в Telegram
router.get('/check-telegram-user', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const telegramUser = await TelegramUser.findOne({ userId });

        if (telegramUser) {
            return res.json({ isRegistered: true });
        } else {
            return res.json({ isRegistered: false, botLink: 'https://t.me/yout_stylist_bot' });
        }
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
            status: 'В ожидании',
        });
        await appointment.save();

        // Популируем данные пользователя и стилиста перед отправкой ответа
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('userId')
            .populate('stylistId');

        // Формируем уведомления
        const userIdFromAppointment = populatedAppointment.userId._id;
        const stylistIdFromAppointment = populatedAppointment.stylistId._id;
        const appointmentDate = new Date(appointment.date).toLocaleDateString('ru-RU');

        const userName = `${populatedAppointment.userId.name} ${populatedAppointment.userId.surname}`;
        const userPhone = populatedAppointment.userId.phone;
        const stylistName = `${populatedAppointment.stylistId.name} ${populatedAppointment.stylistId.surname}`;
        const stylistPhone = populatedAppointment.stylistId.phone;
        const stylistChatLink = populatedAppointment.stylistId.chatLink || 'Свяжитесь через сайт';

        const userTelegram = await TelegramUser.findOne({ userId: userIdFromAppointment });
        const stylistTelegram = await TelegramUser.findOne({ userId: stylistIdFromAppointment });

        const userChatLink = userTelegram && userTelegram.username ? `https://t.me/${userTelegram.username.replace('@', '')}` : 'Свяжитесь через сайт';

        let botLink = null;
        if (userTelegram) {
            const userMessage = `Новая запись к стилисту ${stylistName} на ${appointmentDate} в ${appointment.time} (Ожидает подтверждения).\n📞 Телефон стилиста: ${stylistPhone}\n💬 Связаться: ${stylistChatLink}`;
            await sendNotification(userTelegram.chatId, userMessage);
        } else {
            botLink = 'https://t.me/yout_stylist_bot';
        }

        if (stylistTelegram) {
            const stylistMessage = `Новая запись от клиента ${userName} на ${appointmentDate} в ${appointment.time} (Ожидает подтверждения).\n📞 Телефон клиента: ${userPhone}\n💬 Связаться: ${userChatLink}`;
            await sendNotification(stylistTelegram.chatId, stylistMessage);
        }

        res.status(201).json({
            appointment: populatedAppointment,
            botLink: botLink ? botLink : undefined,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Подтвердить запись
router.patch('/stylists/:id/appointments/:appointmentId/confirm', authenticateToken, async (req, res) => {
    try {
        const { id, appointmentId } = req.params;

        // Проверяем роль пользователя
        if (req.user.role !== 'stylist') {
            return res.status(403).json({ message: 'Unauthorized: Only stylists can confirm appointments' });
        }

        // Проверяем, что стилист существует
        const stylist = await Stylist.findById(id);
        if (!stylist) {
            return res.status(404).json({ message: 'Стилист не найден' });
        }

        console.log('Stylist phone:', normalizePhone(stylist.phone), 'User phone:', normalizePhone(req.user.phone));

        // Проверяем, что пользователь — это стилист
        if (normalizePhone(stylist.phone) !== normalizePhone(req.user.phone)) {
            return res.status(403).json({ message: 'Unauthorized: You are not this stylist' });
        }

        // Находим запись
        const appointment = await Appointment.findById(appointmentId).populate('userId').populate('stylistId');
        if (!appointment) {
            return res.status(404).json({ message: 'Запись не найдена' });
        }

        // Проверяем, что запись принадлежит этому стилисту
        if (appointment.stylistId._id.toString() !== id) {
            return res.status(403).json({ message: 'Unauthorized: This appointment does not belong to this stylist' });
        }

        // Проверяем текущий статус
        if (appointment.status !== 'В ожидании') {
            return res.status(400).json({ message: 'Эта запись уже подтверждена или отменена' });
        }

        // Обновляем статус на "Подтверждена"
        appointment.status = 'Подтверждена';
        await appointment.save();

        // Отправляем уведомление пользователю о подтверждении
        const userId = appointment.userId._id;
        const userTelegram = await TelegramUser.findOne({ userId });
        const appointmentDate = new Date(appointment.date).toLocaleDateString('ru-RU');
        const stylistName = `${appointment.stylistId.name} ${appointment.stylistId.surname}`;
        const stylistPhone = appointment.stylistId.phone;
        const stylistChatLink = appointment.stylistId.chatLink || 'Свяжитесь через сайт';

        if (userTelegram) {
            const userMessage = `Ваша запись к стилисту ${stylistName} на ${appointmentDate} в ${appointment.time} была подтверждена.\n📞 Телефон стилиста: ${stylistPhone}\n💬 Связаться: ${stylistChatLink}`;
            await sendNotification(userTelegram.chatId, userMessage);
        }

        res.json({ message: 'Запись успешно подтверждена' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Удалить запись
router.delete('/stylists/:id/appointments/:appointmentId', authenticateToken, async (req, res) => {
    try {
        const { id, appointmentId } = req.params;

        // Проверяем роль пользователя
        if (req.user.role !== 'stylist') {
            return res.status(403).json({ message: 'Unauthorized: Only stylists can delete appointments' });
        }

        // Проверяем, что стилист существует
        const stylist = await Stylist.findById(id);
        if (!stylist) {
            return res.status(404).json({ message: 'Стилист не найден' });
        }

        console.log('Stylist phone:', normalizePhone(stylist.phone), 'User phone:', normalizePhone(req.user.phone));

        // Проверяем, что пользователь — это стилист
        if (normalizePhone(stylist.phone) !== normalizePhone(req.user.phone)) {
            return res.status(403).json({ message: 'Unauthorized: You are not this stylist' });
        }

        // Находим запись
        const appointment = await Appointment.findById(appointmentId).populate('userId').populate('stylistId');
        if (!appointment) {
            return res.status(404).json({ message: 'Запись не найдена' });
        }

        // Проверяем, что запись принадлежит этому стилисту
        if (appointment.stylistId._id.toString() !== id) {
            return res.status(403).json({ message: 'Unauthorized: This appointment does not belong to this stylist' });
        }

        // Отправляем уведомление пользователю об отмене
        const userId = appointment.userId._id;
        const userTelegram = await TelegramUser.findOne({ userId });
        const appointmentDate = new Date(appointment.date).toLocaleDateString('ru-RU');
        const stylistName = `${appointment.stylistId.name} ${appointment.stylistId.surname}`;

        if (userTelegram) {
            const userMessage = `Ваша запись к стилисту ${stylistName} на ${appointmentDate} в ${appointment.time} была отменена.`;
            await sendNotification(userTelegram.chatId, userMessage);
        }

        // Удаляем запись
        await Appointment.deleteOne({ _id: appointmentId });
        res.json({ message: 'Запись успешно удалена' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;