import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Register from '../components/Register.jsx';
import SignIn from '../components/SignIn.jsx';
import ProfileModal from '../components/ProfileModal.jsx';
import { useNavigate } from 'react-router-dom';

export default function MainPage() {
    const [modalType, setModalType] = useState(null);
    const [redirectAfterLogin, setRedirectAfterLogin] = useState(false); // Флаг для редиректа
    const [stylists, setStylists] = useState([]);
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStylists = async () => {
            try {
                const response = await fetch('/api/stylists');
                const data = await response.json();
                setStylists(data);
            } catch (error) {
                console.error('Ошибка загрузки стилистов:', error);
            }
        };
        fetchStylists();
    }, []);

    // Проверяем, нужно ли перенаправить после авторизации
    useEffect(() => {
        if (isAuthenticated && redirectAfterLogin) {
            navigate('/catalog');
            setRedirectAfterLogin(false); // Сбрасываем флаг
        }
    }, [isAuthenticated, redirectAfterLogin, navigate]);

    const handleUserIconClick = () => {
        if (!isAuthenticated) {
            setModalType('signin');
        } else {
            setModalType('profile');
        }
    };

    const handleFindClick = () => {
        if (!isAuthenticated) {
            setModalType('signin');
            setRedirectAfterLogin(true); // Устанавливаем флаг для редиректа после авторизации
        } else {
            navigate('/catalog');
        }
    };

    const closeModal = () => {
        setModalType(null);
        setRedirectAfterLogin(false); // Сбрасываем флаг, если модальное окно закрыто
    };

    const switchToRegister = () => {
        setModalType('register');
    };

    const switchToSignIn = () => {
        setModalType('signin');
    };

    const cards = [...stylists, ...stylists, ...stylists, ...stylists].map((stylist, index) => (
        <div className="card" key={index}>
            <img
                src={stylist.photoLink}
                alt={`${stylist.name} ${stylist.surname}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
            />
        </div>
    ));

    return (
        <div className="main-container">
            <div className="gallery">{cards}</div>
            <div className="bg-img">
                <img src="/img/192.png" alt="Background" />
            </div>
            <div className="user-cont">
                {isAuthenticated && user?.name && <div className="user-name">{user.name}</div>}
                <div className="user-logo-cont" onClick={handleUserIconClick}>
                    <img
                        src="/img/User_Circle.svg"
                        alt="User Icon"
                        style={{ cursor: 'pointer' }}
                        width={50}
                        height={50}
                    />
                </div>
            </div>

            <h1>ТВОЙ СТИЛИСТ</h1>

            <div className="find-btn-cont" onClick={handleFindClick}>
                <div className="find-btn">найти</div>
                <img src="/img/Arrow.svg" alt="Arrow" />
            </div>

            {modalType && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {modalType === 'register' ? (
                            <Register closeModal={closeModal} switchToSignIn={switchToSignIn} />
                        ) : modalType === 'signin' ? (
                            <SignIn closeModal={closeModal} switchToRegister={switchToRegister} />
                        ) : (
                            <ProfileModal closeModal={closeModal} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}