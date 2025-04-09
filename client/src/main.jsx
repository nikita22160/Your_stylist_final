import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import App from './App';
import './index.css';
import { ToastNotifications } from './components/ToastNotifications'; // Импортируем уведомления

ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider store={store}>
        <PersistGate loading={<div>Загрузка...</div>} persistor={persistor}>
            <App />
            <ToastNotifications /> {/* Добавляем контейнер для уведомлений */}
        </PersistGate>
    </Provider>
);