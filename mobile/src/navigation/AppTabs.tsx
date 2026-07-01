import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Bell, Home, PlusSquare, Search, User, Video } from 'lucide-react-native';
import { CreateScreen } from '../screens/CreateScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ReelsScreen } from '../screens/ReelsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { selectThemeMode, useAppSelector } from '../store';

export type AppTabParamList = {
  Home: undefined;
  Reels: undefined;
  Search: undefined;
  Create: undefined;
  Inbox: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

const icons = {
  Home,
  Reels: Video,
  Search,
  Create: PlusSquare,
  Inbox: Bell,
  Profile: User,
};

export function AppTabs() {
  const mode = useAppSelector(selectThemeMode);
  const isDark = mode === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const Icon = icons[route.name];

        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ focused }) => <Icon size={focused ? 24 : 21} color={focused ? '#6c5ce7' : isDark ? '#f8fafc' : '#64748b'} />,
          tabBarStyle: {
            height: 70,
            paddingTop: 10,
            paddingBottom: 14,
            backgroundColor: isDark ? '#080b0f' : '#ffffff',
            borderTopColor: isDark ? '#1c2230' : '#e2e8f0',
          },
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Reels" component={ReelsScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Inbox" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
