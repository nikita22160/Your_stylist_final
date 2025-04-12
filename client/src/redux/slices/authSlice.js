import { createSlice } from '@reduxjs/toolkit';

// Создаём срез состояния для управления авторизацией
const authSlice = createSlice({
    name: 'auth',
    initialState: {
        isAuthenticated: false, // Флаг авторизации
        user: null, // Данные пользователя
        token: null, // Токен авторизации
    },
    reducers: {
        // Действие для входа в систему
        login(state, action) {
            state.isAuthenticated = true;
            state.user = action.payload.user; // Устанавливаем данные пользователя
            state.token = action.payload.token; // Устанавливаем токен
        },
        // Действие для выхода из системы
        logout(state) {
            state.isAuthenticated = false;
            state.user = null; // Очищаем данные пользователя
            state.token = null; // Очищаем токен
        },
    },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;