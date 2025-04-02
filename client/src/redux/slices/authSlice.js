import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        isAuthenticated: false,
        user: null, // Добавляем поле для данных пользователя
    },
    reducers: {
        login(state, action) {
            state.isAuthenticated = true;
            state.user = action.payload; // Сохраняем данные пользователя
        },
        logout(state) {
            state.isAuthenticated = false;
            state.user = null;
        },
    },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;