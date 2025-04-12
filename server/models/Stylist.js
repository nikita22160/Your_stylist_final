const mongoose = require('mongoose');

const stylistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    surname: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    chatLink: {
        type: String,
    },
    photoLink: {
        type: String,
    },
    city: {
        type: String,
        required: true,
    },
    price: {
        type: {
            perHour: {
                type: Number,
                required: false, // Цена за час
            },
            perDay: {
                type: Number,
                required: false, // Цена за день
            },
            eventLook: {
                type: Number,
                required: false, // Образ под мероприятие
            },
            styleConsultation: {
                type: Number,
                required: false, // Консультация по стилю
            },
            wardrobeAnalysis: {
                type: Number,
                required: false, // Разбор гардероба
            },
            shoppingSupport: {
                type: Number,
                required: false, // Шопинг-сопровождение
            },
        },
        required: false, // Поле price само по себе необязательное
    },
});

module.exports = mongoose.model('Stylist', stylistSchema);