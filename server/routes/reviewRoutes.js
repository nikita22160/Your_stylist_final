const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Stylist = require('../models/Stylist');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middleware/authMiddleware');

// Создать отзыв о записи
router.post('/stylists/:id/reviews', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, appointmentId } = req.body;
        const userId = req.user._id;

        console.log('Received review request:', { id, rating, appointmentId, userId });

        const stylist = await Stylist.findById(id);
        if (!stylist) {
            return res.status(404).json({ message: 'Стилист не найден' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Запись не найдена' });
        }

        if (appointment.stylistId.toString() !== id) {
            return res.status(400).json({ message: 'Эта запись не относится к указанному стилисту' });
        }
        if (appointment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Вы можете оставлять отзывы только на свои записи' });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Рейтинг должен быть от 1 до 5' });
        }

        const existingReview = await Review.findOne({ appointmentId, userId });
        if (existingReview) {
            console.log('Existing review found:', existingReview);
            return res.status(400).json({ message: 'Вы уже оставили отзыв на эту запись' });
        }

        const review = new Review({
            stylistId: id,
            userId,
            appointmentId,
            rating,
        });

        await review.save();

        const populatedReview = await Review.findById(review._id)
            .populate('userId', 'name surname')
            .populate('stylistId', 'name surname')
            .populate('appointmentId');

        res.status(201).json(populatedReview);
    } catch (error) {
        console.error('Error in POST /stylists/:id/reviews:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Вы уже оставили отзыв на эту запись' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Удалить отзыв
router.delete('/stylists/:id/reviews/:reviewId', authMiddleware, async (req, res) => {
    try {
        const { id, reviewId } = req.params;
        const userId = req.user._id;

        // Проверяем, существует ли стилист
        const stylist = await Stylist.findById(id);
        if (!stylist) {
            return res.status(404).json({ message: 'Стилист не найден' });
        }

        // Находим отзыв
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Отзыв не найден' });
        }

        // Проверяем, что отзыв принадлежит стилисту
        if (review.stylistId.toString() !== id) {
            return res.status(400).json({ message: 'Этот отзыв не относится к указанному стилисту' });
        }

        // Проверяем, что пользователь удаляет свой отзыв
        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Вы можете удалять только свои отзывы' });
        }

        // Удаляем отзыв
        await Review.deleteOne({ _id: reviewId });
        res.json({ message: 'Отзыв успешно удалён' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Получить все отзывы о стилисте
router.get('/stylists/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;

        // Проверяем, существует ли стилист
        const stylist = await Stylist.findById(id);
        if (!stylist) {
            return res.status(404).json({ message: 'Стилист не найден' });
        }

        // Находим все отзывы о стилисте и популируем данные пользователя и записи
        const reviews = await Review.find({ stylistId: id })
            .populate('userId', 'name surname')
            .populate('appointmentId')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;