import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { showSuccess, showError } from '../components/ToastNotifications';
import PriceModal from '../components/PriceModal';
import SignIn from '../components/SignIn';

export default function StylistProfile() {
    const { id } = useParams();
    const [stylist, setStylist] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [modalType, setModalType] = useState(null);
    const [showBotModal, setShowBotModal] = useState(false);
    const [botLink, setBotLink] = useState(null);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [averageRating, setAverageRating] = useState(0);
    const [hasReviews, setHasReviews] = useState(false);
    const navigate = useNavigate();
    const { user, isAuthenticated, token } = useSelector((state) => state.auth);

    const normalizePhone = (phone) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        return digits.startsWith('+') ? digits : `+${digits}`;
    };

    const isStylist = isAuthenticated && user && stylist && user.role === 'stylist' && normalizePhone(stylist.phone) === normalizePhone(user.phone);

    useEffect(() => {
        console.log('User from Redux:', user);
        console.log('Stylist:', stylist);
        console.log('isStylist:', isStylist);
    }, [user, stylist, isStylist]);

    useEffect(() => {
        const fetchStylist = async () => {
            try {
                const response = await fetch(`/api/stylists/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Не удалось загрузить данные стилиста');
                setStylist(data);
            } catch (error) {
                showError(`Ошибка загрузки стилиста: ${error.message}`);
            }
        };

        const fetchAppointments = async () => {
            try {
                if (!isAuthenticated || !token) {
                    setAppointments([]);
                    return;
                }

                const response = await fetch(`/api/stylists/${id}/appointments`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Не удалось загрузить записи');
                setAppointments(data);
            } catch (error) {
                showError(`Ошибка загрузки записей: ${error.message}`);
            }
        };

        const fetchReviews = async () => {
            try {
                const response = await fetch(`/api/stylists/${id}/reviews`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Не удалось загрузить отзывы');

                if (data.length > 0) {
                    const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
                    const avgRating = (totalRating / data.length).toFixed(1);
                    setAverageRating(avgRating);
                    setHasReviews(true);
                } else {
                    setAverageRating(0);
                    setHasReviews(false);
                }
            } catch (error) {
                showError(`Ошибка загрузки отзывов: ${error.message}`);
            }
        };

        fetchStylist();
        fetchAppointments();
        fetchReviews();
    }, [id, token, isAuthenticated]);

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedTime(null);
    };

    const handleTimeChange = (time) => {
        setSelectedTime(time);
    };

    const handleBackToCatalog = () => {
        navigate('/catalog');
    };

    const checkTelegramUser = async () => {
        try {
            const response = await fetch('/api/check-telegram-user', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Не удалось проверить Telegram-пользователя');
            }

            const data = await response.json();
            if (!data.isRegistered) {
                setBotLink(data.botLink);
                setShowBotModal(true);
            }
        } catch (error) {
            showError(`Ошибка проверки Telegram-пользователя: ${error.message}`);
        }
    };

    const handleBookAppointment = async () => {
        if (!isAuthenticated || !user || !user._id) {
            setShowSignInModal(true);
            return;
        }

        try {
            if (!token) {
                throw new Error('Токен отсутствует. Пожалуйста, войдите в систему.');
            }

            const response = await fetch(`/api/stylists/${id}/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user._id,
                    date: selectedDate,
                    time: selectedTime,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Не удалось создать запись');
            }

            const data = await response.json();
            const newAppointment = data.appointment;

            setAppointments([...appointments, newAppointment]);
            showSuccess('Заявка на запись создана! Ожидайте подтверждения стилиста.');

            await checkTelegramUser();

            setSelectedDate(null);
            setSelectedTime(null);
        } catch (error) {
            showError(`Ошибка при записи: ${error.message}`);
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        if (!isStylist) {
            showError('Только стилист может отменить запись');
            return;
        }

        try {
            const response = await fetch(`/api/stylists/${id}/appointments/${appointmentId}`, {
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
        }
    };

    const handleConfirmAppointment = async (appointmentId) => {
        if (!isStylist) {
            showError('Только стилист может подтвердить запись');
            return;
        }

        try {
            const response = await fetch(`/api/stylists/${id}/appointments/${appointmentId}/confirm`, {
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
        }
    };

    const canLeaveReview = (appt) => {
        const appointmentDateTime = new Date(appt.date);
        const [hours, minutes] = appt.time.split(':').map(Number);
        appointmentDateTime.setHours(hours, minutes, 0, 0);

        const now = new Date();
        return appt.status === 'Подтверждена' && now > appointmentDateTime;
    };

    const availableHours = Array.from({ length: 10 }, (_, i) => {
        const hour = 10 + i;
        return `${hour}:00`;
    });

    const isDateDisabled = ({ date }) => {
        const normalizedDate = new Date(date).setHours(0, 0, 0, 0);
        return appointments.some(
            (appt) =>
                new Date(appt.date).setHours(0, 0, 0, 0) === normalizedDate &&
                availableHours.every((time) =>
                    appointments.some(
                        (a) => a.time === time && new Date(a.date).setHours(0, 0, 0, 0) === normalizedDate
                    )
                )
        );
    };

    const getAvailableHoursForDate = () => {
        if (!selectedDate) return [];
        const normalizedDate = new Date(selectedDate).setHours(0, 0, 0, 0);
        const bookedTimes = appointments
            .filter((appt) => new Date(appt.date).setHours(0, 0, 0, 0) === normalizedDate)
            .map((appt) => appt.time);
        return availableHours.filter((time) => !bookedTimes.includes(time));
    };

    const availableTimes = getAvailableHoursForDate();

    const closeModal = () => {
        setModalType(null);
    };

    const handlePriceClick = () => {
        setModalType('prices');
    };

    const closeBotModal = () => {
        setShowBotModal(false);
        setBotLink(null);
    };

    const closeSignInModal = () => {
        setShowSignInModal(false);
    };

    const switchToRegister = () => {
        setShowSignInModal(false);
        navigate('/');
    };

    if (!stylist) {
        return <div className="main-container">Загрузка...</div>;
    }

    return (
        <div className="main-container">
            <div onClick={handleBackToCatalog} className="back-btn">
                <img src="/img/back.svg" alt="Назад" />
            </div>
            <div className="stylist-page-header" onClick={() => navigate('/')}>
                ТВОЙ СТИЛИСТ
            </div>
            <div className="stylist-info-cont">
                <div className="stylist-main-info">
                    <div>
                        <div className="stylist-photo-name">
                            <div className="stylist-photo">
                                <img src={stylist.photoLink} alt={`${stylist.name} ${stylist.surname}`} />
                            </div>
                            <div className="stylist-name">
                                {stylist.name} {stylist.surname}
                            </div>
                        </div>
                        <div className="city-stylist">
                            <h2>Рейтинг</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <img
                                    src={hasReviews ? '/img/star-fill.svg' : '/img/star.svg'}
                                    alt="Star"
                                    style={{ width: '24px', height: '24px' }}
                                />
                                <p>{hasReviews ? `(${averageRating}/5)` : 'отзывов нет'}</p>
                            </div>
                        </div>
                        <div className="city-stylist">
                            <h2>Город</h2>
                            <p>{stylist.city}</p>
                        </div>
                        <div className="contact-btn" onClick={() => window.open(stylist.chatLink, '_blank')}>
                            связаться
                        </div>
                        <div className="contact-btn" onClick={() => navigate(`/stylist/${id}/portfolio`)}>
                            портфолио
                        </div>
                        <div className="contact-btn" onClick={handlePriceClick}>
                            цены
                        </div>
                    </div>
                    <div>
                        <div className="stylist-description">
                            <h2>Описание</h2>
                            <p>{stylist.description}</p>
                        </div>

                        {isStylist ? (
                            <div className="appointment">
                                <h2>Мои записи</h2>
                                <div className="horizontal-appointment-list">
                                    {appointments.length > 0 ? (
                                        appointments.map((appt) => (
                                            <div key={appt._id} className="my-appointment">
                                                <p style={{ textAlign: 'center' }}>
                                                    {new Date(appt.date).toLocaleDateString('ru-RU')} в {appt.time}
                                                </p>
                                                <div>
                                                    <h2>Клиент</h2>
                                                    <p>
                                                        {appt.userId?.name && appt.userId?.surname
                                                            ? `${appt.userId.name} ${appt.userId.surname}`
                                                            : 'Клиент не указан'}
                                                    </p>
                                                    <p>Телефон: {appt.userId?.phone || 'Не указан'}</p>
                                                </div>
                                                <h2>Статус</h2>
                                                <p>{appt.status}</p>
                                                {!canLeaveReview(appt) && (
                                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                                                        <div
                                                            className="remove-appointment"
                                                            onClick={() => handleCancelAppointment(appt._id)}
                                                        >
                                                            отменить
                                                        </div>
                                                        {appt.status === 'В ожидании' && (
                                                            <div
                                                                className="confirm-appointment"
                                                                onClick={() => handleConfirmAppointment(appt._id)}
                                                            >
                                                                подтвердить
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p>У вас пока нет записей.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="appointment">
                                <h2>Записаться</h2>
                                <div className="appointment-calendar">
                                    <div className="calendar-block">
                                        <p>выберите дату</p>
                                        <Calendar
                                            onChange={handleDateChange}
                                            value={selectedDate}
                                            minDate={new Date()}
                                            tileDisabled={isDateDisabled}
                                        />
                                    </div>
                                    {selectedDate && (
                                        <div className="time-selection">
                                            <p>выберите время</p>
                                            <div className="time-list">
                                                {availableTimes.length > 0 ? (
                                                    availableTimes.map((time) => (
                                                        <div
                                                            key={time}
                                                            className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                                                            onClick={() => handleTimeChange(time)}
                                                        >
                                                            {time}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p>Нет доступных часов</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {selectedDate && selectedTime && (
                                    <div
                                        className={`contact-btn book-btn ${selectedDate && selectedTime ? 'active' : ''}`}
                                        onClick={handleBookAppointment}
                                    >
                                        записаться
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {modalType && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {modalType === 'prices' && <PriceModal closeModal={closeModal} stylist={stylist} />}
                    </div>
                </div>
            )}

            {showBotModal && (
                <div className="modal-overlay" onClick={closeBotModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="register-cont">
                            <p>Чтобы получать напоминания о записях, подключите нашего Telegram-бота! 🚀</p>
                            <a
                                href={botLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="contact-btn"
                            >
                                Подключить бота
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {showSignInModal && (
                <div className="modal-overlay" onClick={closeSignInModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <SignIn closeModal={closeSignInModal} switchToRegister={switchToRegister} />
                    </div>
                </div>
            )}
        </div>
    );
}