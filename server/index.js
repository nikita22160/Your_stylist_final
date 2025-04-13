const express = require('express');
const connectDB = require('./db');
const userRoutes = require('./routes/userRoutes');
const stylistRoutes = require('./routes/stylistRoutes');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/portfolioRoutes');
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

// Подключаемся к MongoDB
connectDB();

app.use(express.json());

app.use('/api', userRoutes);
app.use('/api', stylistRoutes);
app.use('/api', authRoutes);
app.use('/api', postRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the Stylist API');
});

// Планировщик задач для напоминаний за день
cron.schedule('0 0 * * *', async () => { // Запускается каждый день в 00:00
    try {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);

        // Находим подтверждённые записи на завтра
        const appointments = await Appointment.find({
            date: {
                $gte: tomorrow,
                $lte: tomorrowEnd,
            },
            status: 'Подтверждена', // Только подтверждённые записи
        }).populate('userId').populate('stylistId');

        for (const appointment of appointments) {
            const userId = appointment.userId._id;
            const stylistId = appointment.stylistId._id;
            const appointmentDate = new Date(appointment.date).toLocaleDateString('ru-RU');

            // Данные для уведомлений
            const userName = `${appointment.userId.name} ${appointment.userId.surname}`;
            const userPhone = appointment.userId.phone;
            const stylistName = `${appointment.stylistId.name} ${appointment.stylistId.surname}`;
            const stylistPhone = appointment.stylistId.phone;
            const stylistChatLink = appointment.stylistId.chatLink || 'Свяжитесь через сайт';

            // Находим Telegram-пользователей
            const userTelegram = await TelegramUser.findOne({ userId });
            const stylistTelegram = await TelegramUser.findOne({ userId: stylistId });

            // Формируем ссылку на Telegram пользователя (если он подключён и имеет username)
            const userChatLink = userTelegram && userTelegram.username ? `https://t.me/${userTelegram.username.replace('@', '')}` : 'Свяжитесь через сайт';

            // Отправляем уведомления пользователю
            if (userTelegram) {
                const userMessage = `Напоминание: у вас запись к стилисту ${stylistName} на ${appointmentDate} в ${appointment.time}.\n📞 Телефон стилиста: ${stylistPhone}\n💬 Связаться: ${stylistChatLink}`;
                await sendNotification(userTelegram.chatId, userMessage);
            }

            // Отправляем уведомления стилисту
            if (stylistTelegram) {
                const stylistMessage = `Напоминание: к вам запись от клиента ${userName} на ${appointmentDate} в ${appointment.time}.\n📞 Телефон клиента: ${userPhone}\n💬 Связаться: ${userChatLink}`;
                await sendNotification(stylistTelegram.chatId, stylistMessage);
            }
        }
    } catch (error) {
        console.error('Ошибка в планировщике напоминаний:', error.message);
    }
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});