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
        type: String, // Например, "14:00"
        required: true,
    },
    status: {
        type: String,
        enum: ['В ожидании', 'Подтверждена'], // Возможные статусы
        default: 'В ожидании', // По умолчанию "В ожидании"
        required: true,
    },
});

module.exports = mongoose.model('Appointment', appointmentSchema);