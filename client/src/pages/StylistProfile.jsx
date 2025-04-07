import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function StylistProfile() {
    const { id } = useParams();
    const [stylist, setStylist] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null); // null до выбора даты
    const [selectedTime, setSelectedTime] = useState(null); // Выбранный час
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStylist = async () => {
            try {
                const response = await fetch(`/api/stylists/${id}`);
                const data = await response.json();
                setStylist(data);
            } catch (error) {
                console.error('Ошибка загрузки стилиста:', error);
            }
        };
        fetchStylist();
    }, [id]);

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedTime(null); // Сбрасываем выбор часа при смене даты
        console.log('Выбранная дата:', date);
    };

    const handleTimeChange = (time) => {
        setSelectedTime(time);
        console.log('Выбранное время:', time);
    };

    const handleBackToCatalog = () => {
        navigate('/catalog');
    };

    // Генерация списка часов (10:00–19:00)
    const availableHours = Array.from({ length: 10 }, (_, i) => {
        const hour = 10 + i;
        return `${hour}:00`;
    });

    if (!stylist) {
        return <div className="main-container">Загрузка...</div>;
    }

    return (
        <div className="main-container">
            <div onClick={handleBackToCatalog} className="back-btn">
                <img src="/img/back.svg" alt="Назад" />
            </div>
            <div className="stylist-page-header" onClick={() => navigate('/')}>ТВОЙ СТИЛИСТ</div>
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
                    </div>

                    <div>
                        <div className="stylist-description">
                            <h2>Описание</h2>
                            <p>{stylist.description}</p>
                        </div>
                        <div className="appointment">
                            <div className='appointment-calendar'>
                                <div>
                                    <h2>Выберите дату</h2>
                                    <Calendar
                                        onChange={handleDateChange}
                                        value={selectedDate}
                                        minDate={new Date()}
                                    />
                                </div>
                                <div>
                                    {selectedDate && (
                                        <div className="time-selection">
                                            <h3>Выберите время</h3>
                                            <div className="time-list">
                                                {availableHours.map((time) => (
                                                    <div
                                                        key={time}
                                                        className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                                                        onClick={() => handleTimeChange(time)}
                                                    >
                                                        {time}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="contact-btn">записаться</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}