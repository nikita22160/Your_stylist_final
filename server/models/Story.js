const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    stylistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stylist',
        required: true,
    },
    videoUrl: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    avatarId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 24 * 60 * 60, // Автоматическое удаление через 24 часа (как в Instagram)
    },
});

module.exports = mongoose.model('Story', storySchema);