import { useState } from 'react';
import { useSelector } from 'react-redux';
import Register from '../components/Register.jsx';

export default function MainPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    const handleUserIconClick = () => {
        if (!isAuthenticated) {
            setIsModalOpen(true);
        } else {
            console.log('Переход в личный кабинет');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="main-container">
            <div className="bg-img">
                <img src="/img/192.png" alt="Background" />
            </div>
            <div className="user-logo-cont" onClick={handleUserIconClick}>
                <img src="/img/User_Circle.svg" alt="User Icon" style={{ cursor: 'pointer' }} />
            </div>
            <h1>ТВОЙ СТИЛИСТ</h1>

            {/* Модальное окно */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <Register closeModal={closeModal} /> {/* Передаём функцию закрытия */}
                    </div>
                </div>
            )}
        </div>
    );
}