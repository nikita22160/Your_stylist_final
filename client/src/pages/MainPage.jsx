import { useState } from 'react';
import { useSelector } from 'react-redux';
import Register from '../components/Register.jsx';
import SignIn from '../components/SignIn.jsx';

export default function MainPage() {
    const [modalType, setModalType] = useState(null); // null, 'register' или 'signin'
    const { isAuthenticated, user } = useSelector((state) => state.auth); // Получаем имя пользователя из Redux

    const handleUserIconClick = () => {
        if (!isAuthenticated) {
            setModalType('signin'); // По умолчанию открываем SignIn
        } else {
            console.log('Переход в личный кабинет');
        }
    };

    const closeModal = () => {
        setModalType(null);
    };

    const switchToRegister = () => {
        setModalType('register');
    };

    const switchToSignIn = () => {
        setModalType('signin');
    };

    return (
        <div className="main-container">
            <div className="bg-img">
                <img src="/img/192.png" alt="Background" />
            </div>
            <div className='user-cont'>
                {isAuthenticated && user?.name && (
                    <div className="user-name">{user.name}</div>
                )}
                <div className="user-logo-cont" onClick={handleUserIconClick}>
                    <img src="/img/User_Circle.svg" alt="User Icon" style={{ cursor: 'pointer' }} />
                </div>
            </div>

            <h1>ТВОЙ СТИЛИСТ</h1>

            <div>
                <div>найти</div>
            </div>

            {modalType && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {modalType === 'register' ? (
                            <Register closeModal={closeModal} switchToSignIn={switchToSignIn} />
                        ) : (
                            <SignIn closeModal={closeModal} switchToRegister={switchToRegister} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}