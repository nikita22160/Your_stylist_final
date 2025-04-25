import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { showSuccess, showError } from '../components/ToastNotifications';
import { persistor } from "../redux/store.js";

export default function ProfilePage() {
    const { user, token, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [showQRModal, setShowQRModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState({ name: '', surname: '', phone: '' });
    const [isTelegramConnected, setIsTelegramConnected] = useState(false);
    const [telegramBotLink, setTelegramBotLink] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Инициализация данных пользователя для редактирования
    useEffect(() => {
        if (user) {
            setEditedUser({
                name: user.name || '',
                surname: user.surname || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    // Проверка подключения Telegram-бота
    useEffect(() => {
        const checkTelegramConnection = async () => {
            if (!isAuthenticated || !token) return;
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
    }, [isAuthenticated, token]);

    // Получение записей пользователя
    useEffect(() => {
        const fetchAppointments = async () => {
            if (!isAuthenticated || !user || !token) {
                navigate('/'); // Перенаправляем на главную, если не авторизован
                return;
            }

            try {
                const response = await fetch(`/api/appointments/user`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Не удалось загрузить записи');
                }

                const data = await response.json();
                setAppointments(data);
            } catch (error) {
                showError(`Ошибка загрузки записей: ${error.message}`);
                if (error.message.includes('Токен')) {
                    navigate('/');
                }
            }
        };

        fetchAppointments();
    }, [user, token, isAuthenticated, navigate]);

    // Обработчик выхода из системы
    const handleLogout = () => {
        dispatch(logout());
        persistor.purge();
        navigate('/');
        showSuccess('Вы успешно вышли из системы');
    };

    // Обработчик редактирования профиля
    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (isEditing) {
            setEditedUser({
                name: user.name || '',
                surname: user.surname || '',
                phone: user.phone || '',
            });
        }
    };

    // Обработчик изменения данных в форме
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedUser((prev) => ({ ...prev, [name]: value }));
    };

    // Обработчик сохранения изменений
    const handleSaveChanges = async () => {
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
            // Обновляем данные в Redux (если нужно, можно диспатчить действие для обновления user в store)
        } catch (error) {
            showError(`Ошибка обновления профиля: ${error.message}`);
            if (error.message.includes('Токен')) {
                navigate('/');
            }
        }
    };

    // Обработчик отмены записи
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

    // Обработчик оплаты
    const handlePay = () => {
        setShowQRModal(true);
    };

    // Закрытие модального окна с QR-кодом
    const closeQRModal = () => {
        setShowQRModal(false);
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
                            <div className="user-profile-block">{user?.phone || 'Не указано'}</div>
                            <div className="contact-btn" onClick={handleEditToggle} style={{ marginTop: '20px' }}>
                                Редактировать
                            </div>
                        </>
                    )}
                </div>

                {/* Информация о Telegram-боте */}
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

                {/* Список записей пользователя */}
                <div className="appointment" style={{ marginTop: '20px' }}>
                    <h2>Мои записи</h2>
                    <div className="horizontal-appointment-list">
                        {appointments.length > 0 ? (
                            appointments.map((appt) => (
                                <div key={appt._id} className="my-appointment">
                                    <p style={{ textAlign: 'center' }}>
                                        {new Date(appt.date).toLocaleDateString('ru-RU')} в {appt.time}
                                    </p>
                                    {appt.stylistId?.name && appt.stylistId?.surname ? (
                                        <div>
                                            <h2>Стилист</h2>
                                            <p>{appt.stylistId.name} {appt.stylistId.surname}</p>
                                        </div>
                                    ) : (
                                        'Стилист не указан'
                                    )}
                                    <h2>Статус</h2>
                                    <p>{appt.status}</p>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        {appt.status === 'В ожидании' && (
                                            <div className="confirm-appointment" onClick={handlePay}>
                                                Оплатить
                                            </div>
                                        )}
                                        <div
                                            className="remove-appointment"
                                            onClick={() => handleCancelAppointment(appt.stylistId._id, appt._id)}
                                        >
                                            Отменить
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>У вас пока нет записей.</p>
                        )}
                    </div>
                </div>

                <div className="logout-btn" onClick={handleLogout} style={{ marginTop: '20px' }}>
                    Выйти
                </div>
            </div>

            {/* Модальное окно с QR-кодом */}
            {showQRModal && (
                <div className="modal-overlay" onClick={closeQRModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="register-cont">
                            <p>Оплатите запись с помощью QR-кода:</p>
                            <img src="/img/QR.png" alt="QR Code" style={{ maxWidth: '100%', height: 'auto' }} />
                            <div className="contact-btn" onClick={closeQRModal}>
                                Закрыть
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}