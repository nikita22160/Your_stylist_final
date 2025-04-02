import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        isAuthenticated: false, // Изначально пользователь не авторизован
    },
    reducers: {
        login(state) {
            state.isAuthenticated = true; // Действие для входа
        },
        logout(state) {
            state.isAuthenticated = false; // Действие для выхода
        },
    },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;