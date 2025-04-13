import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from './ToastNotifications';
import { persistor } from "../redux/store.js";
import { useState, useEffect } from 'react';

// Компонент модального окна профиля пользователя
export default function ProfileModal({ closeModal }) {
    const { user, token, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [showQRModal, setShowQRModal] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Получаем записи пользователя
    useEffect(() => {
        const fetchAppointments = async () => {
            if (!isAuthenticated || !user || !token) {
                return;
            }

            try {
                // Получаем все записи текущего пользователя
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

    // Обработка выхода из системы
    const handleLogout = () => {
        dispatch(logout());
        persistor.purge();
        closeModal();
        navigate('/');
        showSuccess('Вы успешно вышли из системы');
    };

    // Обработка отмены записи
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

    // Открытие модального окна с QR-кодом
    const handlePay = () => {
        setShowQRModal(true);
    };

    // Закрытие модального окна с QR-кодом
    const closeQRModal = () => {
        setShowQRModal(false);
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

            {/* Список записей пользователя */}
            <div className="appointment">
                <h2>Мои записи</h2>
                <div className="horizontal-appointment-list">
                    {appointments.length > 0 ? (
                        appointments.map((appt) => (
                            <div key={appt._id} className="my-appointment">
                                <p style={{textAlign: 'center'}}>{new Date(appt.date).toLocaleDateString('ru-RU')} в {appt.time}</p>
                                {appt.stylistId?.name && appt.stylistId?.surname
                                    ?   <div>
                                        <h2>стилист</h2>
                                        <p>{appt.stylistId.name} {appt.stylistId.surname}</p>
                                    </div>
                                    : 'Стилист не указан'}
                                <h2>статус</h2>
                                <p>{appt.status}</p>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    {appt.status === 'В ожидании' && (
                                        <div
                                            className="confirm-appointment"
                                            onClick={handlePay}
                                        >
                                            оплатить
                                        </div>
                                    )}
                                    <div
                                        className="remove-appointment"
                                        onClick={() => handleCancelAppointment(appt.stylistId._id, appt._id)}
                                    >
                                        отменить
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>У вас пока нет записей.</p>
                    )}
                </div>
            </div>

            <div className="logout-btn" onClick={handleLogout}>
                выйти
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