import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActiveUserDto, UserRole } from '../types';

interface UserState {
  currentUser: ActiveUserDto | null;
  connectedUsers: ActiveUserDto[];
  isConnected: boolean;
}

const initialState: UserState = {
  currentUser: null,
  connectedUsers: [],
  isConnected: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<ActiveUserDto>) => {
      state.currentUser = action.payload;
    },
    setConnectedUsers: (state, action: PayloadAction<ActiveUserDto[]>) => {
      state.connectedUsers = action.payload;
    },
    addConnectedUser: (state, action: PayloadAction<ActiveUserDto>) => {
      const exists = state.connectedUsers.find(u => u.id === action.payload.id);
      if (!exists) {
        state.connectedUsers.push(action.payload);
      }
    },
    removeConnectedUser: (state, action: PayloadAction<string>) => {
      state.connectedUsers = state.connectedUsers.filter(u => u.id !== action.payload);
    },
    updateUserRole: (state, action: PayloadAction<{ userId: string; role: UserRole }>) => {
      const user = state.connectedUsers.find(u => u.id === action.payload.userId);
      if (user) {
        user.role = action.payload.role;
      }
      if (state.currentUser?.id === action.payload.userId) {
        state.currentUser.role = action.payload.role;
      }
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    resetUser: (state) => {
      return initialState;
    },
  },
});

export const {
  setCurrentUser,
  setConnectedUsers,
  addConnectedUser,
  removeConnectedUser,
  updateUserRole,
  setConnectionStatus,
  resetUser,
} = userSlice.actions;

export default userSlice.reducer;