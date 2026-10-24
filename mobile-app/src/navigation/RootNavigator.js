import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import TabBar from '../components/TabBar';
import HomeScreen from '../screens/HomeScreen';
import ForecastScreen from '../screens/ForecastScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import TrackerScreen from '../screens/TrackerScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import storage from '../services/storageService';
import { colors } from '../theme/theme';

const Tab = createBottomTabNavigator();

const navTheme = {
  dark: false,
  colors: {
    primary: colors.purple,
    background: colors.bg,
    card: colors.bg,
    text: colors.ink,
    border: colors.hairline,
    notification: colors.purple,
  },
};

function Tabs({ prefs }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" options={{ title: 'Home' }} initialParams={{ prefs }}>
        {(props) => <HomeScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Forecast" options={{ title: 'Forecast' }} component={ForecastScreen} />
      <Tab.Screen name="Workout" options={{ title: 'Workout' }} initialParams={{ prefs }}>
        {(props) => <WorkoutScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Tracker" options={{ title: 'Form' }} component={TrackerScreen} />
    </Tab.Navigator>
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

  return (
    <NavigationContainer theme={navTheme}>
      {prefs ? <Tabs prefs={prefs} /> : <OnboardingScreen onDone={setPrefs} />}
    </NavigationContainer>
  );
}
