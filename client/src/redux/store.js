import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Используем localStorage для сохранения состояния
import authReducer from './slices/authSlice.js';

// Комбинируем редюсеры для корректной работы с redux-persist
const rootReducer = combineReducers({
    auth: authReducer,
});

// Конфигурация redux-persist
const persistConfig = {
    key: 'root', // Ключ для хранения в localStorage
    storage, // Используем localStorage
    whitelist: ['auth'], // Сохраняем только состояние auth
};

// Оборачиваем корневой редюсер в persistReducer для сохранения состояния
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Создаём Redux store с поддержкой persist
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Игнорируем действия redux-persist для избежания ошибок сериализации
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/FLUSH'],
            },
        }),
});

// Создаём persistor для управления сохранением и восстановлением состояния
export const persistor = persistStore(store);

export default store;