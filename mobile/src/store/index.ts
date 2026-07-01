import { PayloadAction, configureStore, createSlice } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { AuthSession } from '@novasocial/shared';

type AuthState = {
  session: AuthSession | null;
};

type ThemeState = {
  mode: 'light' | 'dark';
};

const authSlice = createSlice({
  name: 'auth',
  initialState: { session: null } as AuthState,
  reducers: {
    setSession(state, action: PayloadAction<AuthSession>) {
      state.session = action.payload;
    },
    logout(state) {
      state.session = null;
    },
  },
});

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: 'dark' } as ThemeState,
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.mode = action.payload;
    },
  },
});

export const { setSession, logout } = authSlice.actions;
export const { toggleTheme, setTheme } = themeSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    theme: themeSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector);
export const selectSession = (state: RootState) => state.auth.session;
export const selectThemeMode = (state: RootState) => state.theme.mode;
