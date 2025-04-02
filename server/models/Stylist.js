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
});

module.exports = mongoose.model('Stylist', stylistSchema);