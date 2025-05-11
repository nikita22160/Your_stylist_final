const express = require('express');
const router = express.Router();
const Stylist = require('../models/Stylist');
const Appointment = require('../models/Appointment');
const TelegramUser = require('../models/TelegramUser');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { sendNotification } = require('../telegramBot');
const axios = require('axios');

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

// Создание платежа через API ЮKassa
const createPayment = async (paymentData) => {
    try {
        const response = await axios.post(
            'https://api.yookassa.ru/v3/payments',
            paymentData,
            {
                auth: {
                    username: process.env.YOOKASSA_SHOP_ID,
                    password: process.env.YOOKASSA_SECRET_KEY,
                },
                headers: {
                    'Idempotence-Key': `idempotent-${Date.now()}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('YooKassa payment response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Payment creation error:', error.response?.data || error.message);
        throw new Error(`Failed to create payment: ${error.response?.data?.description || error.message}`);
    }
};

// Создать нового стилиста
router.post('/stylists', async (req, res) => {
    try {
        const { name, surname, phone, city, description, photoLink, chatLink } = req.body;

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
        console.log('Raw appointments with paymentUrl:', appointments);
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
        console.log('Raw user appointments with paymentUrl:', appointments);
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

// Создать новую запись и сгенерировать confirmation_url
router.post('/stylists/:id/appointments', authenticateToken, async (req, res) => {
    try {
        const { userId, date, time, serviceType } = req.body;
        const stylistId = req.params.id;

        if (userId !== req.user._id) {
            return res.status(403).json({ message: 'Unauthorized: You can only book appointments for yourself' });
        }

        const existingAppointment = await Appointment.findOne({
            stylistId,
            date: new Date(date).setHours(0, 0, 0, 0),
            time,
        });
        if (existingAppointment) {
            return res.status(400).json({ message: 'Это время уже занято' });
        }

        const stylist = await Stylist.findById(stylistId);
        if (!stylist || !stylist.price || !stylist.price[serviceType]) {
            return res.status(400).json({ message: 'Услуга недоступна для этого стилиста' });
        }

        const appointment = new Appointment({
            stylistId,
            userId,
            date,
            time,
            status: 'Ожидает оплаты',
            serviceType,
        });
        await appointment.save();

        // Создаём платеж через ЮKassa API
        const payment = await createPayment({
            amount: {
                value: stylist.price[serviceType].toString(),
                currency: 'RUB',
            },
            confirmation: {
                type: 'redirect',
                return_url: `http://localhost:3000/profile`,
            },
            capture: true,
            description: `Оплата услуги "${serviceType}" у стилиста ${stylist.name} ${stylist.surname}`,
            metadata: {
                appointmentId: appointment._id.toString(),
            },
        });

        // Сохраняем confirmation_url в записи
        appointment.paymentUrl = payment.confirmation.confirmation_url; // Используем confirmation_url вместо confirmation_token
        await appointment.save();
        console.log('Saved appointment with paymentUrl:', appointment);

        // Популируем данные перед отправкой ответа
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('userId')
            .populate('stylistId');

        console.log('Populated appointment with paymentUrl:', populatedAppointment);

        // Уведомления
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
            const userMessage = `Новая запись к стилисту ${stylistName} на ${appointmentDate} в ${appointment.time} (${serviceType.replace(/([A-Z])/g, ' $1').trim()} - ${stylist.price[serviceType]} руб.) (Ожидает оплаты).\n📞 Телефон стилиста: ${stylistPhone}\n💬 Связаться: ${stylistChatLink}`;
            await sendNotification(userTelegram.chatId, userMessage);
        } else {
            botLink = 'https://t.me/yout_stylist_bot';
        }

        if (stylistTelegram) {
            const stylistMessage = `Новая запись от клиента ${userName} на ${appointmentDate} в ${appointment.time} (${serviceType.replace(/([A-Z])/g, ' $1').trim()} - ${stylist.price[serviceType]} руб.) (Ожидает оплаты).\n📞 Телефон клиента: ${userPhone}\n💬 Связаться: ${userChatLink}`;
            await sendNotification(stylistTelegram.chatId, stylistMessage);
        }

        res.status(201).json({
            appointment: populatedAppointment,
            paymentUrl: payment.confirmation.confirmation_url, // Возвращаем confirmation_url
            botLink: botLink ? botLink : undefined,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Обработка вебхуков от ЮKassa
router.post('/webhook/yookassa', async (req, res) => {
    try {
        const event = req.body;

        if (event.event === 'payment.succeeded') {
            const payment = event.object;
            const appointmentId = payment.metadata.appointmentId;

            const appointment = await Appointment.findById(appointmentId).populate('userId').populate('stylistId');
            if (!appointment) {
                return res.status(404).json({ message: 'Запись не найдена' });
            }

            appointment.status = 'Ожидает подтверждения';
            appointment.paymentUrl = null; // Очищаем URL после оплаты
            await appointment.save();

            // Уведомления
            const userId = appointment.userId._id;
            const userTelegram = await TelegramUser.findOne({ userId });
            const appointmentDate = new Date(appointment.date).toLocaleDateString('ru-RU');
            const stylistName = `${appointment.stylistId.name} ${appointment.stylistId.surname}`;
            const stylistPhone = appointment.stylistId.phone;
            const stylistChatLink = appointment.stylistId.chatLink || 'Свяжитесь через сайт';

            if (userTelegram) {
                const userMessage = `Оплата вашей записи к стилисту ${stylistName} на ${appointmentDate} в ${appointment.time} (${appointment.serviceType.replace(/([A-Z])/g, ' $1').trim()} - ${appointment.stylistId.price[appointment.serviceType]} руб.) прошла успешно. Ожидайте подтверждения стилиста.\n📞 Телефон стилиста: ${stylistPhone}\n💬 Связаться: ${stylistChatLink}`;
                await sendNotification(userTelegram.chatId, userMessage);
            }

            const stylistId = appointment.stylistId._id;
            const stylistTelegram = await TelegramUser.findOne({ userId: stylistId });
            const userName = `${appointment.userId.name} ${appointment.userId.surname}`;
            const userPhone = appointment.userId.phone;
            const userChatLink = userTelegram && userTelegram.username ? `https://t.me/${userTelegram.username.replace('@', '')}` : 'Свяжитесь через сайт';

            if (stylistTelegram) {
                const stylistMessage = `Клиент ${userName} оплатил запись на ${appointmentDate} в ${appointment.time} (${appointment.serviceType.replace(/([A-Z])/g, ' $1').trim()} - ${appointment.stylistId.price[appointment.serviceType]} руб.). Ожидает вашего подтверждения.\n📞 Телефон клиента: ${userPhone}\n💬 Связаться: ${userChatLink}`;
                await sendNotification(stylistTelegram.chatId, stylistMessage);
            }
        }

        res.status(200).json({ message: 'Webhook received' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Подтвердить запись
router.patch('/stylists/:id/appointments/:appointmentId/confirm', authenticateToken, async (req, res) => {
    try {
        const { id, appointmentId } = req.params;

        if (req.user.role !== 'stylist') {
            return res.status(403).json({ message: 'Unauthorized: Only stylists can confirm appointments' });
        }

        const stylist = await Stylist.findById(id);
        if (!stylist) {
            return res.status(404).json({ message: 'Стилист не найден' });
        }

        if (normalizePhone(stylist.phone) !== normalizePhone(req.user.phone)) {
            return res.status(403).json({ message: 'Unauthorized: You are not this stylist' });
        }

        const appointment = await Appointment.findById(appointmentId).populate('userId').populate('stylistId');
        if (!appointment) {
            return res.status(404).json({ message: 'Запись не найдена' });
        }

        if (appointment.stylistId._id.toString() !== id) {
            return res.status(403).json({ message: 'Unauthorized: This appointment does not belong to this stylist' });
        }

        if (appointment.status !== 'Ожидает подтверждения') {
            return res.status(400).json({ message: 'Эта запись не ожидает подтверждения' });
        }

        appointment.status = 'Подтверждена';
        await appointment.save();

        const userId = appointment.userId._id;
        const userTelegram = await TelegramUser.findOne({ userId });
        const appointmentDate = new Date(appointment.date).toLocaleDateString('ru-RU');
        const stylistName = `${appointment.stylistId.name} ${appointment.stylistId.surname}`;
        const stylistPhone = appointment.stylistId.phone;
        const stylistChatLink = appointment.stylistId.chatLink || 'Свяжитесь через сайт';

        if (userTelegram) {
            const userMessage = `Ваша запись к стилисту ${stylistName} на ${appointmentDate} в ${appointment.time} (${appointment.serviceType.replace(/([A-Z])/g, ' $1').trim()} - ${stylist.price[appointment.serviceType]} руб.) была подтверждена.\n📞 Телефон стилиста: ${stylistPhone}\n💬 Связаться: ${stylistChatLink}`;
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

        const stylist = await Stylist.findById(id);
        if (!stylist) {
            return res.status(404).json({ message: 'Стилист не найден' });
        }

        const appointment = await Appointment.findById(appointmentId).populate('userId').populate('stylistId');
        if (!appointment) {
            return res.status(404).json({ message: 'Запись не найдена' });
        }

        if (appointment.stylistId._id.toString() !== id) {
            return res.status(403).json({ message: 'Unauthorized: This appointment does not belong to this stylist' });
        }

        // Проверка прав: стилист или пользователь
        if (req.user.role === 'stylist') {
            if (normalizePhone(stylist.phone) !== normalizePhone(req.user.phone)) {
                return res.status(403).json({ message: 'Unauthorized: You are not this stylist' });
            }
        } else if (appointment.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized: You can only cancel your own appointments' });
        }

        const userId = appointment.userId._id;
        const userTelegram = await TelegramUser.findOne({ userId });
        const appointmentDate = new Date(appointment.date).toLocaleDateString('ru-RU');
        const stylistName = `${appointment.stylistId.name} ${appointment.stylistId.surname}`;

        if (userTelegram) {
            const userMessage = `Ваша запись к стилисту ${stylistName} на ${appointmentDate} в ${appointment.time} (${appointment.serviceType.replace(/([A-Z])/g, ' $1').trim()} - ${stylist.price[appointment.serviceType]} руб.) была отменена.`;
            await sendNotification(userTelegram.chatId, userMessage);
        }

        await Appointment.deleteOne({ _id: appointmentId });
        res.json({ message: 'Запись успешно удалена' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;