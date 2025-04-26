const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Уникальный индекс: один пользователь может оставить только один отзыв на конкретную запись
reviewSchema.index({ appointmentId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);