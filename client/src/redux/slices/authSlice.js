import { createSlice } from '@reduxjs/toolkit';

// Создаём срез состояния для управления авторизацией
const authSlice = createSlice({
    name: 'auth',
    initialState: {
        isAuthenticated: false, // Флаг авторизации
        user: null, // Данные пользователя
    },
    reducers: {
        // Действие для входа в систему
        login(state, action) {
            state.isAuthenticated = true;
            state.user = action.payload; // Устанавливаем данные пользователя
        },
        // Действие для выхода из системы
        logout(state) {
            state.isAuthenticated = false;
            state.user = null; // Очищаем данные пользователя
        },
    },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;