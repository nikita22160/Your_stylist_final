const express = require('express');
const connectDB = require('./db');
const userRoutes = require('./routes/userRoutes');
const stylistRoutes = require('./routes/stylistRoutes');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/portfolioRoutes');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const app = express();

// Загружаем переменные окружения
dotenv.config();

// Настройка Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Подключаемся к MongoDB
connectDB();

app.use(express.json());

app.use('/api', userRoutes);
app.use('/api', stylistRoutes);
app.use('/api', authRoutes);
app.use('/api', postRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the Stylist API');
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});