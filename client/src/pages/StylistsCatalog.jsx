import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import SignIn from '../components/SignIn'; // Импортируем SignIn
import ProfileModal from '../components/ProfileModal'; // Импортируем ProfileModal

export default function StylistsCatalog() {
    const [stylists, setStylists] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [searchName, setSearchName] = useState(''); // Состояние для поиска по имени
    const [modalType, setModalType] = useState(null); // Состояние для модального окна
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStylists = async () => {
            try {
                const response = await fetch('/api/stylists');
                const data = await response.json();
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

    // Фильтрация по городу и имени
    const filteredStylists = stylists.filter((stylist) => {
        const matchesCity =
            !selectedCity ||
            (stylist.city && stylist.city.toLowerCase().includes(selectedCity.toLowerCase()));
        const matchesName =
            !searchName ||
            `${stylist.name} ${stylist.surname}`
                .toLowerCase()
                .includes(searchName.toLowerCase().trim());
        return matchesCity && matchesName;
    });

    const handleCityChange = (e) => {
        setSelectedCity(e.target.value);
    };

    const handleNameChange = (e) => {
        setSearchName(e.target.value);
    };

    const handleCardClick = (stylistId) => {
        navigate(`/stylist/${stylistId}`);
    };

    // Обработчик клика по иконке пользователя
    const handleUserIconClick = () => {
        if (!isAuthenticated) {
            setModalType('signin');
        } else {
            setModalType('profile');
        }
    };

    // Закрытие модального окна
    const closeModal = () => {
        setModalType(null);
    };

    // Переключение на регистрацию
    const switchToRegister = () => {
        setModalType('register');
    };

    return (
        <div className="main-container">
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

            <div className="catalog-header" onClick={() => navigate('/')}>
                ТВОЙ СТИЛИСТ
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
                <input
                    className="name-find"
                    placeholder="Введите имя"
                    value={searchName}
                    onChange={handleNameChange}
                />
            </div>

            <div className="cards-cont">
                {filteredStylists.map((stylist) => (
                    <div
                        className="stylist-card"
                        key={stylist._id}
                        onClick={() => handleCardClick(stylist._id)}
                        style={{ cursor: 'pointer' }}
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

            {/* Модальное окно */}
            {modalType && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {modalType === 'signin' ? (
                            <SignIn closeModal={closeModal} switchToRegister={switchToRegister} />
                        ) : (
                            <ProfileModal closeModal={closeModal} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}