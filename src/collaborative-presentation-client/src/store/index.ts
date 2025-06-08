import { configureStore } from '@reduxjs/toolkit';
import presentationReducer from './presentationSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    presentation: presentationReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Debug window store
if (typeof window !== 'undefined') {
  (window as any).store = store;
}