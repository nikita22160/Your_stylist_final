const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    stylistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stylist',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Ожидает оплаты', 'Ожидает подтверждения', 'Подтверждена', 'Отменена'],
        default: 'Ожидает оплаты',
    },
    serviceType: {
        type: String,
        required: true,
    },
    paymentUrl: { // Добавляем поле для URL оплаты
        type: String,
        default: null,
    },
});

module.exports = mongoose.model('Appointment', appointmentSchema);