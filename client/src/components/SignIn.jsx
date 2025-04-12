import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../redux/slices/authSlice.js';
import { persistor } from '../redux/store';
import { showSuccess, showError } from './ToastNotifications';

// Компонент для формы входа в систему
export default function SignIn({ closeModal, switchToRegister }) {
    const [formData, setFormData] = useState({
        phone: '',
        password: '',
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
        try {
            const response = await fetch('/api/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formData.phone,
                    password: formData.password,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                dispatch(login({ user: data.user, token: data.token }));
                await persistor.flush();
                closeModal();
                showSuccess('Вход успешен!');
            } else {
                showError(data.message || 'Ошибка входа');
            }
        } catch (error) {
            showError('Произошла ошибка при входе');
        }
    };

    const isFormValid = () => {
        return formData.phone.length === 18 && formData.password.trim();
    };

    return (
        <div className="register-cont">
            <div className="register-header">ВОЙТИ</div>
            <form onSubmit={handleSubmit}>
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
                <div className="button-cont">
                    <button type="submit" className="submit-btn" disabled={!isFormValid()}>
                        войти
                    </button>
                </div>
                <div className="enter-btn-cont">
                    <div className="enter-btn" onClick={switchToRegister}>
                        зарегистрироваться
                    </div>
                </div>
            </form>
        </div>
    );
}