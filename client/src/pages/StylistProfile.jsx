import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { showSuccess, showError, showWarning } from '../components/ToastNotifications';

// Компонент профиля стилиста с возможностью записи
export default function StylistProfile() {
    const { id } = useParams();
    const [stylist, setStylist] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const navigate = useNavigate();
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        const fetchStylist = async () => {
            try {
                const response = await fetch(`/api/stylists/${id}`);
                const data = await response.json();
                setStylist(data);
            } catch (error) {
                showError('Ошибка загрузки стилиста');
            }
        };

        const fetchAppointments = async () => {
            try {
                const response = await fetch(`/api/stylists/${id}/appointments`);
                const data = await response.json();
                setAppointments(data);
            } catch (error) {
                showError('Ошибка загрузки записей');
            }
        };

        fetchStylist();
        fetchAppointments();
    }, [id]);

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

    const handleBookAppointment = async () => {
        if (!isAuthenticated || !user || !user._id) {
            showWarning('Пожалуйста, войдите в систему для записи');
            navigate('/');
            return;
        }

        try {
            const response = await fetch(`/api/stylists/${id}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id,
                    date: selectedDate,
                    time: selectedTime,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }

            const newAppointment = await response.json();
            setAppointments([...appointments, newAppointment]);
            showSuccess('Запись успешно создана!');
            setSelectedDate(null);
            setSelectedTime(null);
        } catch (error) {
            showError(`Ошибка при записи: ${error.message}`);
        }
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
                            <h2>Города</h2>
                            <p>{stylist.city}</p>
                        </div>
                        <div className="contact-btn" onClick={() => window.open(stylist.chatLink, '_blank')}>
                            связаться
                        </div>
                        <div className="contact-btn" onClick={() => window.open(stylist.chatLink, '_blank')}>
                            портфолио
                        </div>
                        <div className="contact-btn" onClick={() => window.open(stylist.chatLink, '_blank')}>
                            цены
                        </div>
                    </div>
                    <div>
                        <div className="stylist-description">
                            <h2>Описание</h2>
                            <p>{stylist.description}</p>
                        </div>
                        <div className="appointment">
                            <div className="appointment-calendar">
                                <div>
                                    <h2>Выберите дату</h2>
                                    <Calendar
                                        onChange={handleDateChange}
                                        value={selectedDate}
                                        minDate={new Date()}
                                        tileDisabled={isDateDisabled}
                                    />
                                </div>
                                {selectedDate && (
                                    <div className="time-selection">
                                        <h3>Выберите время</h3>
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
                    </div>
                </div>
            </div>
        </div>
    );
}