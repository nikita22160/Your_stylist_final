import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Импортируем базовые стили календаря

export default function StylistProfile() {
    const { id } = useParams(); // Получаем ID стилиста из URL
    const [stylist, setStylist] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

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
        console.log('Выбранная дата:', date); // Здесь можно добавить логику записи
    };

    if (!stylist) {
        return <div className="main-container">Загрузка...</div>;
    }

    return (
        <div className="main-container">
            <div className="stylist-profile">
                <div className="stylist-info">
                    <img
                        src={stylist.photoLink}
                        alt={`${stylist.name} ${stylist.surname}`}
                        className="stylist-profile-img"
                    />
                    <h2>{`${stylist.name} ${stylist.surname}`}</h2>
                    <p><strong>Город:</strong> {stylist.city}</p>
                    <p><strong>Телефон:</strong> {stylist.phone}</p>
                    <p><strong>Описание:</strong> {stylist.description}</p>
                    <a href={stylist.chatLink} target="_blank" rel="noopener noreferrer" className="chat-link">
                        Написать в Telegram
                    </a>
                </div>
                <div className="stylist-calendar">
                    <h3>ЗАПИСАТЬСЯ</h3>
                    <Calendar
                        onChange={handleDateChange}
                        value={selectedDate}
                        minDate={new Date()} // Ограничение на будущие даты
                    />
                </div>
            </div>
        </div>
    );
}