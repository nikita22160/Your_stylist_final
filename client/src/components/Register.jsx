import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../redux/slices/authSlice.js';
import { persistor } from '../redux/store';
import { showSuccess, showError, showWarning } from './ToastNotifications';

// Компонент для формы регистрации нового пользователя
export default function Register({ closeModal, switchToSignIn }) {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const dispatch = useDispatch();

    const formatPhoneNumber = (value) => {
        let digits = value.replace(/\D/g, '');
        if (!digits) return '';
        if (digits.startsWith('8')) digits = '7' + digits.slice(1);
        if (digits.startsWith('9')) digits = '7' + digits;
        digits = digits.slice(0, 11);
        let formatted = '+7';
        if (digits.length > 1) formatted += ` (${digits.slice(1, 4)}`;
        if (digits.length > 4) formatted += `) ${digits.slice(4, 7)}`;
        if (digits.length > 7) formatted += `-${digits.slice(7, 9)}`;
        if (digits.length > 9) formatted += `-${digits.slice(9, 11)}`;
        return formatted;
    };

    const normalizePhone = (phone) => {
        const digits = phone.replace(/\D/g, '');
        return digits.startsWith('+') ? digits : `+${digits}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const formattedPhone = formatPhoneNumber(value);
            setFormData({ ...formData, [name]: formattedPhone });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            showWarning('Пароли не совпадают');
            return;
        }

        try {
            const normalizedPhone = normalizePhone(formData.phone);
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    surname: formData.surname,
                    phone: normalizedPhone,
                    password: formData.password,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                dispatch(login({ user: data.user, token: data.token }));
                await persistor.flush();
                closeModal();
                showSuccess('Регистрация успешна!');
            } else {
                showError(data.message || 'Ошибка регистрации');
            }
        } catch (error) {
            showError('Произошла ошибка при регистрации');
        }
    };

    const isFormValid = () => {
        return (
            formData.name.trim() &&
            formData.surname.trim() &&
            formData.phone.length === 18 &&
            formData.password.trim() &&
            formData.confirmPassword.trim()
        );
    };

    return (
        <div className="register-cont">
            <div className="register-header">РЕГИСТРАЦИЯ</div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="имя"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="surname"
                    placeholder="фамилия"
                    value={formData.surname}
                    onChange={handleChange}
                    required
                />
                <input
                    type="tel"
                    name="phone"
                    placeholder="+7 (922) 123-45-67"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="пароль"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="повторите пароль"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                />
                <div className="button-cont">
                    <button type="submit" className="submit-btn" disabled={!isFormValid()}>
                        зарегистрироваться
                    </button>
                </div>
                <div className="enter-btn-cont">
                    <div className="enter-btn" onClick={switchToSignIn}>
                        войти
                    </div>
                </div>
            </form>
        </div>
    );
}