import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { showSuccess } from './ToastNotifications'; // Импортируем уведомление

// Компонент модального окна профиля пользователя
export default function ProfileModal({ closeModal }) {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Обработка выхода из системы
    const handleLogout = () => {
        dispatch(logout());
        closeModal();
        navigate('/');
        showSuccess('Вы успешно вышли из системы'); // Уведомление о выходе
    };

    return (
        <div className="register-cont">
            <div className="register-header">ПРОФИЛЬ</div>
            <div className="profile-info">
                <p className="user-profile-block-head">имя</p>
                <div className="user-profile-block">{user?.name || 'Не указано'}</div>
                <p className="user-profile-block-head">фамилия</p>
                <div className="user-profile-block">{user?.surname || 'Не указано'}</div>
                <p className="user-profile-block-head">телефон</p>
                <div className="user-profile-block">{user?.phone || 'Не указано'}</div>
            </div>
            <div className="logout-btn" onClick={handleLogout}>
                выйти
            </div>
        </div>
    );
}