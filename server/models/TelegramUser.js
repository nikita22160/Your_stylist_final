const mongoose = require('mongoose');

const telegramUserSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    username: {
        type: String, // Telegram-username пользователя (например, @username)
        required: false, // Не все пользователи могут иметь username
    },
});

module.exports = mongoose.model('TelegramUser', telegramUserSchema);