const mongoose = require('mongoose');

const portfolioPostSchema = new mongoose.Schema({
    stylistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stylist',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    photos: {
        type: [String], // Массив URL-адресов фотографий
        required: true,
        validate: {
            validator: (array) => array.length > 0,
            message: 'At least one photo is required',
        },
    },
    hashtags: {
        type: [String], // Массив хэштегов
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('PortfolioPost', portfolioPostSchema);