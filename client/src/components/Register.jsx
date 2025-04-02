import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../redux/slices/authSlice.js';

export default function Register({ closeModal }) {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const dispatch = useDispatch();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    surname: formData.surname,
                    phone: formData.phone,
                    password: formData.password,
                }),
            });

            if (response.ok) {
                dispatch(login());
                closeModal(); // Закрываем модалку после успешной регистрации
                alert('Регистрация успешна!');
            } else {
                alert('Ошибка регистрации');
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    };

    return (
        <div className="register-cont">
            <h2>Регистрация</h2>
            <form onSubmit={handleSubmit}>
                <div>Имя</div>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                <div>Фамилия</div>
                <input type="text" name="surname" value={formData.surname} onChange={handleChange} required />
                <div>Номер телефона</div>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                <div>Пароль</div>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                <div>Повторите пароль</div>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                <button type="submit" className="submit-btn">
                    Зарегистрироваться
                </button>
            </form>
            <button onClick={closeModal} className="close-btn">
                Закрыть
            </button>
        </div>
    );
}