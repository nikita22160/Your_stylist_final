import { useState, useEffect, useRef } from 'react';
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
    const [selectedService, setSelectedService] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [modalType, setModalType] = useState(null);
    const [showBotModal, setShowBotModal] = useState(false);
    const [botLink, setBotLink] = useState(null);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [averageRating, setAverageRating] = useState(0);
    const [hasReviews, setHasReviews] = useState(false);
    const [stories, setStories] = useState([]);
    const [showStoryGallery, setShowStoryGallery] = useState(false);
    const [newStoryModal, setNewStoryModal] = useState(false);
    const [storyText, setStoryText] = useState('');
    const [avatarId, setAvatarId] = useState('');
    const [voiceId, setVoiceId] = useState('0011dfc1f6f544f1b8a6988489d6bf47');
    const [isLoading, setIsLoading] = useState(false);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const storyContainerRef = useRef(null);
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

        const fetchStories = async () => {
            try {
                const response = await fetch(`/api/stylists/${id}/stories`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const data = await response.json();
                if (response.ok) setStories(data);
            } catch (error) {
                showError(`Ошибка загрузки сторис: ${error.message}`);
            }
        };

        fetchStylist();
        fetchAppointments();
        fetchReviews();
        fetchStories();
    }, [id, token, isAuthenticated]);

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedTime(null);
        setSelectedService(null);
    };

    const handleTimeChange = (time) => {
        setSelectedTime(time);
    };

    const handleServiceChange = (service) => {
        setSelectedService(service);
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

        if (!selectedDate || !selectedTime || !selectedService) {
            showError('Пожалуйста, выберите дату, время и тип услуги');
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
                    serviceType: selectedService,
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
            setSelectedService(null);
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
        setNewStoryModal(false);
        setIsLoading(false);
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

    const handleUserIconClick = () => {
        if (!isAuthenticated) {
            setShowSignInModal(true);
        } else {
            navigate('/profile');
        }
    };

    const handleAddStory = async () => {
        if (!storyText || !avatarId) {
            showError('Пожалуйста, заполните все поля');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/stories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    stylistId: id,
                    text: storyText,
                    avatarId,
                    voiceId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Не удалось создать сторис');
            }

            const newStory = await response.json();
            setStories([newStory, ...stories]);
            showSuccess('Сторис успешно добавлена!');
            setNewStoryModal(false);
            setStoryText('');
            setAvatarId('');
            setVoiceId('0011dfc1f6f544f1b8a6988489d6bf47');
        } catch (error) {
            showError(`Ошибка при создании сторис: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhotoClick = () => {
        setShowStoryGallery(true);
        setCurrentStoryIndex(0);
    };

    const handlePrevStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
        }
    };

    const handleNextStory = () => {
        if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
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

    const getServicePrice = (serviceType) => {
        return stylist?.price?.[serviceType] || 'Цена не указана';
    };

    const getAvailableServices = () => {
        if (!stylist || !stylist.price) return [];
        const validServices = ['perHour', 'perDay', 'eventLook', 'styleConsultation', 'wardrobeAnalysis', 'shoppingSupport'];
        return Object.keys(stylist.price).filter(
            (service) => validServices.includes(service) && stylist.price[service] && getServiceName(service) !== 'Неизвестная услуга'
        );
    };

    const availableServices = getAvailableServices();

    if (!stylist) {
        return <div className="main-container">Загрузка...</div>;
    }

    return (
        <div className="main-container">
            <div onClick={handleBackToCatalog} className="back-btn">
                <img src="/img/back.svg" alt="Назад" />
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
            <div className="stylist-page-header" onClick={() => navigate('/')}>
                ТВОЙ СТИЛИСТ
            </div>
            <div className="stylist-info-cont">
                <div className="stylist-main-info">
                    <div>
                        <div className="stylist-photo-name" onClick={handlePhotoClick}>
                            <div className="stylist-photo">
                                <img src={stylist.photoLink} alt={`${stylist.name} ${stylist.surname}`} />
                            </div>
                            <div className="stylist-name">
                                {stylist.name} {stylist.surname}
                            </div>
                        </div>
                        {isStylist && (
                            <div className="contact-btn" onClick={() => setNewStoryModal(true)}>
                                Добавить видео
                            </div>
                        )}
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
                                                <h2>Услуга</h2>
                                                <p>
                                                    {getServiceName(appt.serviceType)} - {getServicePrice(appt.serviceType)} руб.
                                                </p>
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
                                    {selectedDate && selectedTime && stylist.price && (
                                        <div className="time-selection">
                                            <p>выберите услугу</p>
                                            <div className="time-list">
                                                {availableServices.length > 0 ? (
                                                    availableServices.map((service) => (
                                                        <div
                                                            key={service}
                                                            className={`time-slot ${selectedService === service ? 'selected' : ''}`}
                                                            onClick={() => handleServiceChange(service)}
                                                        >
                                                            {getServiceName(service)} - {stylist.price[service]} руб.
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p>Нет доступных услуг</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {selectedDate && selectedTime && selectedService && (
                                    <div
                                        className={`contact-btn book-btn ${selectedDate && selectedTime && selectedService ? 'active' : ''}`}
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
                        <button className="close-btn" onClick={closeBotModal}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
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

            {newStoryModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content story-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontFamily: '"SF-Pro-Display-Thin", sans-serif' }}>Создать новую сторис</h2>
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <div className="spinner" style={{
                                    border: '4px solid rgba(0, 0, 0, 0.1)',
                                    borderLeft: '4px solid #000',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    animation: 'spin 1s linear infinite',
                                    margin: '0 auto'
                                }}></div>
                                <p>Генерация видео... Это может занять до 2 минут.</p>
                            </div>
                        ) : (
                            <>
                                <textarea
                                    placeholder="Текст для видео"
                                    value={storyText}
                                    onChange={(e) => setStoryText(e.target.value)}
                                    className="story-textarea"
                                    disabled={isLoading}
                                />
                                <input
                                    type="text"
                                    placeholder="ID аватара"
                                    value={avatarId}
                                    onChange={(e) => setAvatarId(e.target.value)}
                                    className="story-input"
                                    disabled={isLoading}
                                />
                                <input
                                    type="text"
                                    placeholder="ID голоса (оставьте пустым для значения по умолчанию)"
                                    value={voiceId}
                                    onChange={(e) => setVoiceId(e.target.value)}
                                    className="story-input"
                                    disabled={isLoading}
                                />
                                <div className="story-modal-actions">
                                    <button onClick={handleAddStory} className="story-modal-btn" disabled={isLoading}>
                                        Создать видео
                                    </button>
                                    <button onClick={closeModal} className="story-modal-btn cancel-btn" disabled={isLoading}>
                                        Отмена
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <style>
                        {`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}
                    </style>
                </div>
            )}

            {showStoryGallery && (
                <div className="modal-overlay" onClick={() => setShowStoryGallery(false)}>
                    <div className="modal-content story-gallery" onClick={(e) => e.stopPropagation()}>
                        {stories.length > 0 ? (
                            <div className="story-gallery-container">
                                <button className="gallery-arrow left-arrow" onClick={handlePrevStory} disabled={currentStoryIndex === 0}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                        <path d="M15 18L9 12L15 6" />
                                    </svg>
                                </button>
                                <div className="story-video-container">
                                    <div className="story-video-list" style={{ transform: `translateX(-${currentStoryIndex * 100}%)` }}>
                                        {stories.map((story, index) => (
                                            <video
                                                key={index}
                                                src={story.videoUrl}
                                                controls
                                                className="story-video"
                                                style={{ width: '100%', maxWidth: '800px' }} // Явно задаем ширину
                                                autoPlay={index === currentStoryIndex}
                                                muted={index !== currentStoryIndex}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button className="gallery-arrow right-arrow" onClick={handleNextStory} disabled={currentStoryIndex === stories.length - 1}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                        <path d="M9 18L15 12L9 6" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <p className="no-stories">Сторис пока нет</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}