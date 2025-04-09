import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Базовые стили

// SVG-иконки (взято из Feather Icons и адаптировано)
const SuccessIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M18.1827 7.32544C18.6058 7.75935 18.6058 8.46287 18.1827 8.89679L10.5994 16.6746C10.1763 17.1085 9.49037 17.1085 9.0673 16.6746L5.8173 13.3412C5.39423 12.9073 5.39423 12.2038 5.8173 11.7699C6.24037 11.336 6.9263 11.336 7.34937 11.7699L9.83333 14.3175L16.6506 7.32544C17.0737 6.89152 17.7596 6.89152 18.1827 7.32544Z"
              fill="#155724"/>
    </svg>
);

const ErrorIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.29289 7.29289C7.68342 6.90237 8.31658 6.90237 8.70711 7.29289L12 10.5858L15.2929 7.29289C15.6834 6.90237 16.3166 6.90237 16.7071 7.29289C17.0976 7.68342 17.0976 8.31658 16.7071 8.70711L13.4142 12L16.7071 15.2929C17.0976 15.6834 17.0976 16.3166 16.7071 16.7071C16.3166 17.0976 15.6834 17.0976 15.2929 16.7071L12 13.4142L8.70711 16.7071C8.31658 17.0976 7.68342 17.0976 7.29289 16.7071C6.90237 16.3166 6.90237 15.6834 7.29289 15.2929L10.5858 12L7.29289 8.70711C6.90237 8.31658 6.90237 7.68342 7.29289 7.29289Z"
              fill="#721c24"/>
    </svg>

);

const WarningIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 9V13M12 16V16.01M3 12C3 13.1819 3.23279 14.3522 3.68508 15.4442C4.13738 16.5361 4.80031 17.5282 5.63604 18.364C6.47177 19.1997 7.46392 19.8626 8.55585 20.3149C9.64778 20.7672 10.8181 21 12 21C13.1819 21 14.3522 20.7672 15.4442 20.3149C16.5361 19.8626 17.5282 19.1997 18.364 18.364C19.1997 17.5282 19.8626 16.5361 20.3149 15.4442C20.7672 14.3522 21 13.1819 21 12C21 10.8181 20.7672 9.64778 20.3149 8.55585C19.8626 7.46392 19.1997 6.47177 18.364 5.63604C17.5282 4.80031 16.5361 4.13738 15.4442 3.68508C14.3522 3.23279 13.1819 3 12 3C10.8181 3 9.64778 3.23279 8.55585 3.68508C7.46392 4.13738 6.47177 4.80031 5.63604 5.63604C4.80031 6.47177 4.13738 7.46392 3.68508 8.55585C3.23279 9.64778 3 10.8181 3 12Z"
              stroke="#856404" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
);

// Кастомные уведомления
export const showSuccess = (message) =>
    toast.success(
        <div className="toast-content">
            <SuccessIcon />
            <span>{message}</span>
        </div>,
        { className: 'toast-success', icon: false } // Отключаем встроенную иконку
    );

export const showError = (message) =>
    toast.error(
        <div className="toast-content">
            <ErrorIcon />
            <span>{message}</span>
        </div>,
        { className: 'toast-error', icon: false } // Отключаем встроенную иконку
    );

export const showWarning = (message) =>
    toast.warn(
        <div className="toast-content">
            <WarningIcon />
            <span>{message}</span>
        </div>,
        { className: 'toast-warning', icon: false } // Отключаем встроенную иконку
    );

// Компонент контейнера для уведомлений
export const ToastNotifications = () => (
    <ToastContainer
        position="top-center" // Позиция по центру сверху
        autoClose={3000} // Автозакрытие через 3 секунды
        hideProgressBar // Без полосы прогресса
        closeOnClick // Закрытие по клику
        pauseOnHover // Пауза при наведении
        draggable // Возможность перетаскивать
        theme="light"
        transition={Slide} // Плавная анимация Slide
        closeButton={false} // Отключаем крестик для закрытия
    />
);