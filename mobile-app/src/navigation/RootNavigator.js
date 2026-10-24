import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import TabBar from '../components/TabBar';
import HomeScreen from '../screens/HomeScreen';
import ForecastScreen from '../screens/ForecastScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import TrackerScreen from '../screens/TrackerScreen';
import FloorScreen from '../screens/FloorScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import storage from '../services/storageService';
import { colors } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

function Tabs({ prefs }) {
  const { theme } = useTheme();

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

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" options={{ title: 'Home' }} initialParams={{ prefs }}>
          {(props) => <HomeScreen {...props} />}
        </Tab.Screen>
        <Tab.Screen name="Forecast" options={{ title: 'Forecast' }} component={ForecastScreen} />
        <Tab.Screen name="Floor" options={{ title: 'Floor' }} component={FloorScreen} />
        <Tab.Screen name="Workout" options={{ title: 'Workout' }} initialParams={{ prefs }}>
          {(props) => <WorkoutScreen {...props} />}
        </Tab.Screen>
        <Tab.Screen name="Tracker" options={{ title: 'Form' }} component={TrackerScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState(null);

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
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }

  if (!prefs) {
    return (
      <NavigationContainer>
        <OnboardingScreen onDone={setPrefs} />
      </NavigationContainer>
    );
  }

  return <Tabs prefs={prefs} />;
}
