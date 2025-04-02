const express = require('express');
const router = express.Router();
const Stylist = require('../models/Stylist');

// Создать нового стилиста
router.post('/stylists', async (req, res) => {
    try {
        const stylist = new Stylist(req.body);
        await stylist.save();
        res.status(201).json(stylist);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Получить всех стилистов
router.get('/stylists', async (req, res) => {
    try {
        const stylists = await Stylist.find();
        res.json(stylists);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;