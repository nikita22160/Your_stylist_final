import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { showSuccess, showError } from '../components/ToastNotifications';
import { persistor } from "../redux/store.js";
import PaymentModal from '../components/PaymentModal';

export default function ProfilePage() {
    const { user, token, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentUrl, setSelectedPaymentUrl] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState({ name: '', surname: '', phone: '' });
    const [isTelegramConnected, setIsTelegramConnected] = useState(false);
    const [telegramBotLink, setTelegramBotLink] = useState(null);
    const [reviews, setReviews] = useState({});
    const [hoveredRating, setHoveredRating] = useState({});
    const [isStylist, setIsStylist] = useState(false);
    const [stylistId, setStylistId] = useState(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const appointmentListRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const normalizePhone = (phone) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        return digits.startsWith('+') ? digits : `+${digits}`;
    };

    useEffect(() => {
        if (user) {
            setEditedUser({
                name: user.name || '',
                surname: user.surname || '',
                phone: user.phone || '',
            });
        } else {
            setEditedUser({ name: '', surname: '', phone: '' });
        }
    }, [user]);

    useEffect(() => {
        const checkIfStylist = async () => {
            if (!isAuthenticated || !user || !token || !user._id) {
                console.warn('User or token is missing, skipping stylist check');
                return;
            }
            try {
                const response = await fetch('/api/stylists', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const stylists = await response.json();
                if (!response.ok) throw new Error('Не удалось загрузить список стилистов');

                const matchedStylist = stylists.find(
                    (stylist) => normalizePhone(stylist.phone) === normalizePhone(user.phone) && user.role === 'stylist'
                );
                if (matchedStylist) {
                    setIsStylist(true);
                    setStylistId(matchedStylist._id);
                } else {
                    setIsStylist(false);
                    setStylistId(null);
                }
            } catch (error) {
                showError(`Ошибка проверки роли стилиста: ${error.message}`);
            }
        };

        checkIfStylist();
    }, [isAuthenticated, user, token]);

    useEffect(() => {
        const checkTelegramConnection = async () => {
            if (!isAuthenticated || !token || !user?. _id) return;
            try {
                const response = await fetch('/api/check-telegram-user', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Не удалось проверить Telegram');
                setIsTelegramConnected(data.isRegistered);
                if (!data.isRegistered) {
                    setTelegramBotLink(data.botLink);
                }
            } catch (error) {
                showError(`Ошибка проверки Telegram: ${error.message}`);
            }
        };

        checkTelegramConnection();
    }, [isAuthenticated, token, user]);

    useEffect(() => {
        const fetchAppointmentsAndReviews = async () => {
            if (!isAuthenticated || !user || !token || !user._id) {
                console.warn('User or token is missing, redirecting to home');
                navigate('/');
                return;
            }

            try {
                let appointmentsData = [];
                if (isStylist && stylistId) {
                    const appointmentsResponse = await fetch(`/api/stylists/${stylistId}/appointments`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (!appointmentsResponse.ok) {
                        const errorData = await appointmentsResponse.json();
                        throw new Error(errorData.message || 'Не удалось загрузить записи стилиста');
                    }
                    appointmentsData = await appointmentsResponse.json();
                    console.log('Fetched stylist appointments:', appointmentsData);
                } else {
                    const appointmentsResponse = await fetch(`/api/appointments/user`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (!appointmentsResponse.ok) {
                        const errorData = await appointmentsResponse.json();
                        throw new Error(errorData.message || 'Не удалось загрузить записи');
                    }
                    appointmentsData = await appointmentsResponse.json();
                    console.log('Fetched user appointments:', appointmentsData);
                }
                setAppointments(appointmentsData);

                const reviewsData = {};
                for (const appt of appointmentsData) {
                    if (!appt || !appt.stylistId || !appt._id) {
                        console.warn('Invalid appointment data:', appt);
                        continue;
                    }
                    const stylistIdForReview = isStylist ? stylistId : appt.stylistId._id;
                    const reviewsResponse = await fetch(`/api/stylists/${stylistIdForReview}/reviews`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (reviewsResponse.ok) {
                        const reviews = await reviewsResponse.json();
                        const appointmentReview = reviews.find((review) => review.appointmentId && review.appointmentId._id === appt._id);
                        if (appointmentReview) {
                            reviewsData[appt._id] = appointmentReview.rating;
                        }
                    }
                }
                setReviews(reviewsData);
            } catch (error) {
                showError(`Ошибка загрузки данных: ${error.message}`);
                if (error.message.includes('Токен')) {
                    navigate('/');
                }
            }
        };

        fetchAppointmentsAndReviews();
    }, [user, token, isAuthenticated, navigate, isStylist, stylistId]);

    const handleLogout = () => {
        dispatch(logout());
        persistor.purge();
        navigate('/');
        showSuccess('Вы успешно вышли из системы');
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (isEditing) {
            setEditedUser({
                name: user?.name || '',
                surname: user?.surname || '',
                phone: user?.phone || '',
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        if (!user || !user._id) {
            showError('Пользователь не авторизован');
            return;
        }
        try {
            const response = await fetch(`/api/users/${user._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editedUser),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Не удалось обновить профиль');
            }

            showSuccess('Профиль успешно обновлен!');
            setIsEditing(false);
        } catch (error) {
            showError(`Ошибка обновления профиля: ${error.message}`);
            if (error.message.includes('Токен')) {
                navigate('/');
            }
        }
    };

    const handleCancelAppointment = async (stylistId, appointmentId) => {
        try {
            const response = await fetch(`${API_URL}/api/stylists/${stylistId}/appointments/${appointmentId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Не удалось отменить запись');
            }

            setAppointments(appointments.filter((appt) => appt._id !== appointmentId));
            showSuccess('Запись успешно отменена!');
        } catch (error) {
            showError(`Ошибка при отмене записи: ${error.message}`);
            if (error.message.includes('Токен')) {
                navigate('/');
            }
        }
    };

    const handleConfirmAppointment = async (stylistId, appointmentId) => {
        try {
            const response = await fetch(`/api/stylists/${stylistId}/appointments/${appointmentId}/confirm`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Не удалось подтвердить запись');
            }

            setAppointments(
                appointments.map((appt) =>
                    appt._id === appointmentId ? { ...appt, status: 'Подтверждена' } : appt
                )
            );
            showSuccess('Запись успешно подтверждена!');
        } catch (error) {
            showError(`Ошибка при подтверждении записи: ${error.message}`);
            if (error.message.includes('Токен')) {
                navigate('/');
            }
        }
    };

    const handlePay = (paymentUrl) => {
        if (!paymentUrl) {
            showError('URL оплаты отсутствует');
            return;
        }
        setSelectedPaymentUrl(paymentUrl);
        setShowPaymentModal(true);
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedPaymentUrl(null);
    };

    const handleRating = async (stylistId, appointmentId, rating) => {
        try {
            console.log('Sending review for:', { stylistId, appointmentId, rating });
            const response = await fetch(`/api/stylists/${stylistId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ rating, appointmentId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Не удалось оставить отзыв');
            }

            setReviews((prev) => ({
                ...prev,
                [appointmentId]: rating,
            }));
            setHoveredRating((prev) => ({ ...prev, [appointmentId]: 0 }));
            showSuccess('Отзыв успешно сохранён!');
        } catch (error) {
            showError(`Ошибка при сохранении отзыва: ${error.message}`);
            if (error.message.includes('Токен')) {
                navigate('/');
            }
        }
    };

    const canLeaveReview = (appt) => {
        if (!appt || !appt.date || !appt.status) return false;
        const appointmentDateTime = new Date(appt.date);
        const [hours, minutes] = appt.time.split(':').map(Number);
        appointmentDateTime.setHours(hours, minutes, 0, 0);

        const now = new Date();
        return appt.status === 'Подтверждена' && now > appointmentDateTime;
    };

    const scrollLeft = () => {
        if (appointmentListRef.current) {
            const newPosition = scrollPosition - 220;
            appointmentListRef.current.scrollTo({
                left: newPosition,
                behavior: 'smooth',
            });
            setScrollPosition(newPosition);
        }
    };

    const scrollRight = () => {
        if (appointmentListRef.current) {
            const newPosition = scrollPosition + 220;
            appointmentListRef.current.scrollTo({
                left: newPosition,
                behavior: 'smooth',
            });
            setScrollPosition(newPosition);
        }
    };

    const getServiceName = (serviceType) => {
        const serviceNames = {
            perHour: 'Час работы',
            perDay: 'День работы',
            eventLook: 'Образ для мероприятия',
            styleConsultation: 'Консультация по стилю',
            wardrobeAnalysis: 'Разбор гардероба',
            shoppingSupport: 'Шопинг-сопровождение',
        };
        return serviceNames[serviceType] || 'Неизвестная услуга';
    };

    const getServicePrice = (serviceType, stylistId) => {
        const stylist = appointments.find((appt) => appt.stylistId?._id === stylistId)?.stylistId;
        return stylist?.price?.[serviceType] || 'Цена не указана';
    };

    if (!isAuthenticated || !user) {
        return <div className="main-container">Пожалуйста, войдите в систему.</div>;
    }

    return (
        <div className="main-container">
            <div onClick={() => navigate('/')} className="back-btn">
                <img src="/img/back.svg" alt="Назад" />
            </div>
            <div className="stylist-page-header" onClick={() => navigate('/')}>
                ТВОЙ СТИЛИСТ
            </div>
            <div className="profile-cont">
                <h2 className='profile-cont-header'>ПРОФИЛЬ</h2>
                <div className="profile-info">
                    {isEditing ? (
                        <>
                            <p className="user-profile-block-head">Имя</p>
                            <input
                                type="text"
                                name="name"
                                value={editedUser.name}
                                onChange={handleInputChange}
                                className="user-profile-block"
                            />
                            <p className="user-profile-block-head">Фамилия</p>
                            <input
                                type="text"
                                name="surname"
                                value={editedUser.surname}
                                onChange={handleInputChange}
                                className="user-profile-block"
                            />
                            <p className="user-profile-block-head">Телефон</p>
                            <input
                                type="text"
                                name="phone"
                                value={editedUser.phone}
                                onChange={handleInputChange}
                                className="user-profile-block"
                            />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <div className="contact-btn" onClick={handleSaveChanges}>
                                    Сохранить
                                </div>
                                <div className="contact-btn" onClick={handleEditToggle}>
                                    Отмена
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="user-profile-block-head">Имя</p>
                            <div className="user-profile-block">{user?.name || 'Не указано'}</div>
                            <p className="user-profile-block-head">Фамилия</p>
                            <div className="user-profile-block">{user?.surname || 'Не указано'}</div>
                            <p className="user-profile-block-head">Телефон</p>
                            <div className="user-profile-block">{user?.phone || 'Не указан'}</div>
                            <div className="contact-btn" onClick={handleEditToggle} style={{ marginTop: '20px' }}>
                                Редактировать
                            </div>
                        </>
                    )}
                </div>

                <div className="telegram-info" style={{ marginTop: '20px' }}>
                    <h2>Telegram оповещения</h2>
                    {isTelegramConnected ? (
                        <p>Telegram-бот подключён! Вы будете получать напоминания о записях.</p>
                    ) : (
                        <>
                            <p>Telegram-бот не подключён. Подключите бота, чтобы получать напоминания о записях.</p>
                            {telegramBotLink && (
                                <a
                                    href={telegramBotLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="contact-btn"
                                >
                                    Подключить Telegram-бота
                                </a>
                            )}
                        </>
                    )}
                </div>

                <div className="appointment" style={{ marginTop: '20px' }}>
                    <h2>Мои записи</h2>
                    <div className="horizontal-appointment-list" ref={appointmentListRef}>
                        {appointments.length > 0 ? (
                            appointments.map((appt) => {
                                if (!appt || !appt._id) {
                                    console.warn('Invalid appointment:', appt);
                                    return null;
                                }
                                const hasReview = reviews[appt._id] !== undefined;
                                const rating = reviews[appt._id] || 0;
                                const canReview = !isStylist && canLeaveReview(appt);
                                const currentHoveredRating = hoveredRating[appt._id] || 0;
                                const stylistIdForPrice = isStylist ? stylistId : appt.stylistId?._id;

                                console.log('Rendering appointment:', appt);
                                console.log('Payment URL available:', !!appt.paymentUrl);
                                console.log('Status condition:', appt.status === 'Ожидает оплаты');

                                return (
                                    <div key={appt._id} className="my-appointment">
                                        <p style={{ textAlign: 'center' }}>
                                            {new Date(appt.date).toLocaleDateString('ru-RU')} в {appt.time}
                                        </p>
                                        {isStylist ? (
                                            <div>
                                                <h2>Клиент</h2>
                                                <p>
                                                    {appt.userId?.name && appt.userId?.surname
                                                        ? `${appt.userId.name} ${appt.userId.surname}`
                                                        : 'Клиент не указан'}
                                                </p>
                                                <p>Телефон: {appt.userId?.phone || 'Не указан'}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <h2>Стилист</h2>
                                                <p>
                                                    {appt.stylistId?.name && appt.stylistId?.surname
                                                        ? `${appt.stylistId.name} ${appt.stylistId.surname}`
                                                        : 'Стилист не указан'}
                                                </p>
                                            </div>
                                        )}
                                        <h2>Услуга</h2>
                                        <p>
                                            {getServiceName(appt.serviceType)} - {getServicePrice(appt.serviceType, stylistIdForPrice)} руб.
                                        </p>
                                        <h2>Статус</h2>
                                        <p>{appt.status}</p>

                                        {hasReview && (
                                            <div className="star-rating">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <img
                                                        key={star}
                                                        src={star <= rating ? '/img/star-fill.svg' : '/img/star.svg'}
                                                        alt="Star"
                                                        style={{ width: '24px', height: '24px' }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {!hasReview && canReview && (
                                            <div className="star-rating" style={{ marginTop: '10px' }}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <img
                                                        key={star}
                                                        src={
                                                            currentHoveredRating >= star
                                                                ? '/img/star-fill.svg'
                                                                : '/img/star.svg'
                                                        }
                                                        alt="Star"
                                                        style={{ width: '24px', height: '24px', cursor: 'pointer' }}
                                                        onClick={() => handleRating(appt.stylistId._id, appt._id, star)}
                                                        onMouseEnter={() =>
                                                            setHoveredRating((prev) => ({
                                                                ...prev,
                                                                [appt._id]: star,
                                                            }))
                                                        }
                                                        onMouseLeave={() =>
                                                            setHoveredRating((prev) => ({
                                                                ...prev,
                                                                [appt._id]: 0,
                                                            }))
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {isStylist ? (
                                            (appt.status === 'Ожидает подтверждения' || appt.status === 'Подтверждена') && (
                                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                                                    <div
                                                        className="remove-appointment"
                                                        onClick={() => handleCancelAppointment(stylistId, appt._id)}
                                                    >
                                                        отменить
                                                    </div>
                                                    {appt.status === 'Ожидает подтверждения' && (
                                                        <div
                                                            className="confirm-appointment"
                                                            onClick={() => handleConfirmAppointment(stylistId, appt._id)}
                                                        >
                                                            подтвердить
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        ) : (
                                            !hasReview && !canLeaveReview(appt) && (
                                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                                                    {appt.status === 'Ожидает оплаты' && appt.paymentUrl && (
                                                        <div
                                                            className="confirm-appointment"
                                                            onClick={() => handlePay(appt.paymentUrl)}
                                                        >
                                                            Оплатить
                                                        </div>
                                                    )}
                                                    {(appt.status === 'Ожидает оплаты' || appt.status === 'Ожидает подтверждения') && (
                                                        <div
                                                            className="remove-appointment"
                                                            onClick={() => handleCancelAppointment(appt.stylistId._id, appt._id)}
                                                        >
                                                            Отменить
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p>Загрузка записей...</p>
                        )}
                    </div>
                    {appointments.length > 0 && (
                        <>
                            <button className="gallery-arrow left-arrow" onClick={scrollLeft}>
                                ←
                            </button>
                            <button className="gallery-arrow right-arrow" onClick={scrollRight}>
                                →
                            </button>
                        </>
                    )}
                </div>

                <div className="logout-btn" onClick={handleLogout} style={{ marginTop: '20px' }}>
                    Выйти
                </div>
            </div>

            {showPaymentModal && (
                <PaymentModal
                    closeModal={closePaymentModal}
                    paymentUrl={selectedPaymentUrl} // Передаем paymentUrl вместо paymentToken
                />
            )}
        </div>
    );
}