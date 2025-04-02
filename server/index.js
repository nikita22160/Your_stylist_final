const express = require('express');
const connectDB = require('./db');
const userRoutes = require('./routes/userRoutes');
const stylistRoutes = require('./routes/stylistRoutes');
const app = express();
const port = 3000;

// Подключение к MongoDB
connectDB();

app.use(express.json());

// Подключение маршрутов
app.use('/api', userRoutes);
app.use('/api', stylistRoutes);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});