import { configureStore } from '@reduxjs/toolkit';
import userReducer from './reducers/userSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }).concat(),
    devTools: false,
});

export default store;
