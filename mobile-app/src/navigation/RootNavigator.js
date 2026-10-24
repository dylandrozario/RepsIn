import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import TabBar from '../components/TabBar';
import HomeScreen from '../screens/HomeScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import TrackerScreen from '../screens/TrackerScreen';
import FloorScreen from '../screens/FloorScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import storage from '../services/storageService';
import { colors } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/** Bottom tabs. The avatar in each screen header opens the Profile stack screen. */
function Tabs({ prefs }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" options={{ title: 'Home' }} initialParams={{ prefs }}>
        {(props) => <HomeScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Availability" options={{ title: 'Availability' }} component={FloorScreen} />
      <Tab.Screen name="Workout" options={{ title: 'Workout' }} initialParams={{ prefs }}>
        {(props) => <WorkoutScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Tracker" options={{ title: 'Form' }} component={TrackerScreen} />
    </Tab.Navigator>
  );
}

/** Root stack wraps the tabs so Profile / Edit Profile can be pushed as modals. */
function MainStack({ prefs }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs">
        {(props) => <Tabs {...props} prefs={prefs} />}
      </Stack.Screen>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState(null);

  const navTheme = {
    dark: false,
    colors: {
      primary: theme.accent,
      background: colors.bg,
      card: colors.bg,
      text: colors.ink,
      border: colors.hairline,
      notification: theme.accent,
    },
  };

  useEffect(() => {
    (async () => {
      const saved = await storage.getUserPreferences();
      if (saved) setPrefs(saved);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {prefs ? <MainStack prefs={prefs} /> : <OnboardingScreen onDone={setPrefs} />}
    </NavigationContainer>
  );
}
