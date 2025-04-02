const express = require('express');
const connectDB = require('./db');
const userRoutes = require('./routes/userRoutes');
const stylistRoutes = require('./routes/stylistRoutes');
const authRoutes = require('./routes/authRoutes'); // Добавляем новый маршрут
const app = express();
const port = 3001;

connectDB();

app.use(express.json());

app.use('/api', userRoutes);
app.use('/api', stylistRoutes);
app.use('/api', authRoutes); // Подключаем маршрут для авторизации

app.get('/', (req, res) => {
    res.send('Welcome to the Stylist API');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});