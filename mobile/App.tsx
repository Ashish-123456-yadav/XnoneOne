import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import './global.css';
import { AppTabs } from './src/navigation/AppTabs';
import { AuthScreen } from './src/screens/AuthScreen';
import { selectSession, selectThemeMode, store, useAppSelector } from './src/store';

const queryClient = new QueryClient();

function RootNavigator() {
  const session = useAppSelector(selectSession);
  const mode = useAppSelector(selectThemeMode);
  const isDark = mode === 'dark';

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {session ? <AppTabs /> : <AuthScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
