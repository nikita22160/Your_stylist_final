import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {useNavigate} from "react-router-dom";

export default function StylistsCatalog() {
    const [stylists, setStylists] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const navigate = useNavigate();

    // Загрузка стилистов
    useEffect(() => {
        const fetchStylists = async () => {
            try {
                const response = await fetch('/api/stylists');
                const data = await response.json();
                console.log('Загруженные стилисты:', data);
                setStylists(data);
            } catch (error) {
                console.error('Ошибка загрузки стилистов:', error);
            }
        };
        fetchStylists();
    }, []);

    // Функция для форматирования названия города
    const formatCityName = (city) => {
        const normalizedCity = city.toLowerCase().trim();
        // Специальный случай для Санкт-Петербурга
        if (normalizedCity === 'санкт-петербург' || normalizedCity === 'санкт петербург') {
            return 'Санкт-Петербург';
        }
        // Общая логика для остальных городов
        return city
            .split(/(\s+)/) // Разделяем по пробелам, сохраняя их
            .map((part) => {
                if (part.trim() === '') return part; // Пропускаем пробелы
                return part
                    .split('-') // Разделяем по дефису
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Каждое слово с большой буквы
                    .join('-'); // Соединяем обратно с дефисом
            })
            .join(''); // Соединяем без дополнительных пробелов
    };

    // Извлечение уникальных городов
    const getUniqueCities = () => {
        const cityMap = new Map();

        stylists
            .filter((stylist) => stylist.city)
            .flatMap((stylist) => stylist.city.split(/,\s*|\s+/))
            .filter((city) => city.trim() !== '')
            .forEach((city) => {
                const normalizedCity = city.toLowerCase().replace(/\s+/g, ' ');
                const formattedCity = formatCityName(city);
                cityMap.set(normalizedCity, formattedCity);
            });

        return Array.from(cityMap.values());
    };

    const uniqueCities = getUniqueCities();

    // Фильтрация стилистов по выбранному городу
    const filteredStylists = selectedCity
        ? stylists.filter(
            (stylist) =>
                stylist.city &&
                stylist.city.toLowerCase().includes(selectedCity.toLowerCase())
        )
        : stylists;

    const handleCityChange = (e) => {
        setSelectedCity(e.target.value);
    };

    return (
        <div className="main-container">
            <div>
                <div className="catalog-header" onClick={() => navigate('/')}>ТВОЙ СТИЛИСТ</div>
                <div className="user-cont-catalog">
                    {isAuthenticated && user?.name && (
                        <div className="user-name">{user.name}</div>
                    )}
                    <div className="user-logo-cont-catalog">
                        <img src="/img/User_Circle.svg" alt="User Icon" width='100%' height='100%' />
                    </div>
                </div>
            </div>

            <div className="filter-cont">
                <select value={selectedCity} onChange={handleCityChange}>
                    <option value="">Все города</option>
                    {uniqueCities.map((city) => (
                        <option key={city} value={city}>
                            {city}
                        </option>
                    ))}
                </select>
            </div>

            <div className="cards-cont">
                {filteredStylists.map((stylist) => (
                    <div className="stylist-card" key={stylist._id}>
                        <img
                            src={stylist.photoLink}
                            alt={`${stylist.name} ${stylist.surname}`}
                            style={{ width: '200px', height: '250px', objectFit: 'cover', borderRadius: '10px' }}
                        />
                        <div className="stylist-name">{`${stylist.name} ${stylist.surname}`}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}