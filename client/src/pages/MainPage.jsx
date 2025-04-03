import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Register from '../components/Register.jsx';
import SignIn from '../components/SignIn.jsx';
import { useNavigate } from 'react-router-dom';

export default function MainPage() {
    const [modalType, setModalType] = useState(null);
    const [stylists, setStylists] = useState([]);
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStylists = async () => {
            try {
                const response = await fetch('/api/stylists');
                const data = await response.json();
                setStylists(data);
                console.log(data);
            } catch (error) {
                console.error('Ошибка загрузки стилистов:', error);
            }
        };
        fetchStylists();
    }, []);

    const handleUserIconClick = () => {
        if (!isAuthenticated) {
            setModalType('signin');
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

    // Дублируем стилистов для бесконечной галереи (4 копии)
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
                    <img src="/img/User_Circle.svg" alt="User Icon" style={{ cursor: 'pointer' }} />
                </div>
            </div>

            <h1>ТВОЙ СТИЛИСТ</h1>

            <div className="find-btn-cont" onClick={() => navigate('/catalog')}>
                <div className="find-btn">найти</div>
                <img src="/img/Arrow.svg" />
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