const TelegramBot = require('node-telegram-bot-api');
const TelegramUser = require('./models/TelegramUser');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Функция для нормализации номера телефона
const normalizePhoneNumber = (phone) => {
    return phone.replace(/\D/g, ''); // Удаляем все нечисловые символы
};

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    // Проверяем, зарегистрирован ли пользователь
    const existingUser = await TelegramUser.findOne({ chatId });
    if (existingUser) {
        bot.sendMessage(chatId, 'Вы уже зарегистрированы! 🎉');
        return;
    }

    // Запрашиваем номер телефона
    bot.sendMessage(chatId, 'Привет! Я бот для напоминаний о записях. Пожалуйста, поделись своим номером телефона, чтобы я мог тебя идентифицировать.', {
        reply_markup: {
            keyboard: [[{ text: 'Поделиться номером телефона', request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
});

// Обработка получения контакта
bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const phone = msg.contact.phone_number;
    const username = msg.from.username ? `@${msg.from.username}` : null; // Получаем username, если он есть

    // Нормализуем номер телефона из Telegram
    const normalizedPhone = normalizePhoneNumber(phone);

    try {
        // Ищем пользователя в базе по номеру телефона
        const user = await User.findOne();
        let matchedUser = null;

        // Проверяем всех пользователей, нормализуя их номера
        const users = await User.find();
        for (const u of users) {
            const userPhoneNormalized = normalizePhoneNumber(u.phone);
            if (userPhoneNormalized === normalizedPhone) {
                matchedUser = u;
                break;
            }
        }

        if (!matchedUser) {
            bot.sendMessage(chatId, 'Пользователь с таким номером телефона не найден. Пожалуйста, зарегистрируйтесь на сайте.');
            return;
        }

        // Проверяем, не зарегистрирован ли этот пользователь уже с другим Telegram-аккаунтом
        const existingTelegramUser = await TelegramUser.findOne({ userId: matchedUser._id });
        if (existingTelegramUser) {
            bot.sendMessage(chatId, 'Этот пользователь уже зарегистрирован с другим Telegram-аккаунтом.');
            return;
        }

        // Сохраняем пользователя
        const telegramUser = new TelegramUser({
            chatId: chatId.toString(),
            userId: matchedUser._id,
            username: username, // Сохраняем username
        });
        await telegramUser.save();

        bot.sendMessage(chatId, 'Спасибо! Теперь я буду присылать тебе напоминания о записях. 📅');
    } catch (error) {
        bot.sendMessage(chatId, 'Произошла ошибка. Попробуй снова позже.');
        console.error(error);
    }
});

// Функция для отправки уведомлений
const sendNotification = async (chatId, message) => {
    try {
        await bot.sendMessage(chatId, message);
    } catch (error) {
        console.error(`Ошибка отправки уведомления в чат ${chatId}:`, error.message);
    }
};

module.exports = { bot, sendNotification };