const jwt = require('jsonwebtoken');

// Middleware для проверки авторизации
const authMiddleware = async (req, res, next) => {
    try {
        // Извлекаем токен из заголовка Authorization
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Токен отсутствует. Пожалуйста, авторизуйтесь.' });
        }

        // Проверяем и декодируем токен
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Добавляем данные пользователя в req
        req.user = decoded; // decoded содержит данные, которые были закодированы в токене (например, { _id: userId, phone: user.phone, role: user.role })

        next(); // Передаём управление следующему обработчику
    } catch (error) {
        res.status(401).json({ message: 'Неверный или истёкший токен. Пожалуйста, авторизуйтесь заново.' });
    }
};

module.exports = authMiddleware;