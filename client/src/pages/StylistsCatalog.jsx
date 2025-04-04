import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function StylistsCatalog() {
    const [stylists, setStylists] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

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

    const formatCityName = (city) => {
        const normalizedCity = city.toLowerCase().trim();
        if (normalizedCity === 'санкт-петербург' || normalizedCity === 'санкт петербург') {
            return 'Санкт-Петербург';
        }
        return city
            .split(/(\s+)/)
            .map((part) => {
                if (part.trim() === '') return part;
                return part
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join('-');
            })
            .join('');
    };

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

    const handleCardClick = (stylistId) => {
        navigate(`/stylist/${stylistId}`); // Переход на страницу профиля
    };

    return (
        <div className="main-container">
            <div className="user-cont">
                {isAuthenticated && user?.name && (
                    <div className="user-name">{user.name}</div>
                )}
                <div className="user-logo-cont">
                    <img src="/img/User_Circle.svg" alt="User Icon" style={{ cursor: 'pointer' }} />
                </div>
            </div>

            <div className="catalog-header">ТВОЙ СТИЛИСТ</div>

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
                    <div
                        className="stylist-card"
                        key={stylist._id}
                        onClick={() => handleCardClick(stylist._id)} // Обработчик клика
                        style={{ cursor: 'pointer' }} // Указываем, что карточка кликабельна
                    >
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