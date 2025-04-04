import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function StylistProfile() {
    const { id } = useParams(); // Получаем ID стилиста из URL
    const [stylist, setStylist] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const navigate = useNavigate(); // Добавляем хук для навигации

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

    const handleBackToCatalog = () => {
        navigate('/catalog'); // Переход назад в каталог
    };

    if (!stylist) {
        return <div className="main-container">Загрузка...</div>;
    }

    return (
        <div className="main-container">
            <button className="back-btn" onClick={handleBackToCatalog}>
                Назад в каталог
            </button>
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
                    <h3>Запись на консультацию</h3>
                    <Calendar
                        onChange={handleDateChange}
                        value={selectedDate}
                        minDate={new Date()}
                    />
                </div>
            </div>
        </div>
    );
}