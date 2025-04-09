import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';

export default function ProfileModal({ closeModal }) {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        closeModal();
        navigate('/');
    };

    return (
        <div className="register-cont">
            <div className="register-header">ПРОФИЛЬ</div>
            <div className="profile-info">
                <p>
                    <strong>Имя:</strong> {user?.name || 'Не указано'}
                </p>
                <p>
                    <strong>Фамилия:</strong> {user?.surname || 'Не указано'}
                </p>
                <p>
                    <strong>Телефон:</strong> {user?.phone || 'Не указано'}
                </p>
            </div>
            <div className="button-cont">
                <button className="submit-btn" onClick={handleLogout}>
                    выйти
                </button>
            </div>
        </div>
    );
}