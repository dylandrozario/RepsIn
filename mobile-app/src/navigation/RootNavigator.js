import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import TabBar from '../components/TabBar';
import HomeScreen from '../screens/HomeScreen';
import ForecastScreen from '../screens/ForecastScreen';
import FloorScreen from '../screens/FloorScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import TrackerScreen from '../screens/TrackerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import LandingScreen from '../screens/LandingScreen';
import storage from '../services/storageService';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

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
      <Tab.Screen name="Floor" options={{ title: 'Floor' }} component={FloorScreen} />
      <Tab.Screen name="Workout" options={{ title: 'Workout' }} initialParams={{ prefs }}>
        {(props) => <WorkoutScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Tracker" options={{ title: 'Train' }} component={TrackerScreen} />
      <Tab.Screen name="Profile" options={{ title: 'Profile' }} component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/** Root stack wraps the tabs so EditProfile can be pushed as a modal. */
function MainStack({ prefs }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs">
        {(props) => <Tabs {...props} prefs={prefs} />}
      </Stack.Screen>
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.purple} />
    </View>
  );
}

// Module-level flag so the splash plays once per app launch, not on every
// re-render/auth change within a session.
let landingShown = false;

export default function RootNavigator() {
  const { session, initializing } = useAuth();
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [prefs, setPrefs] = useState(null);
  const [showLanding, setShowLanding] = useState(!landingShown);

  // Load onboarding prefs once we know who the user is.
  useEffect(() => {
    let mounted = true;
    if (!session) {
      setPrefs(null);
      setLoadingPrefs(false);
      return undefined;
    }
    setLoadingPrefs(true);
    (async () => {
      const saved = await storage.getUserPreferences();
      if (mounted) {
        setPrefs(saved);
        setLoadingPrefs(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [session]);

  // Animated landing plays once per launch, before anything else. Tappable to skip.
  if (showLanding) {
    return <LandingScreen onDone={() => { landingShown = true; setShowLanding(false); }} />;
  }

  // Still restoring the auth session.
  if (initializing) return <Loading />;

  return (
    <NavigationContainer theme={navTheme}>
      {!session ? (
        <LoginScreen />
      ) : loadingPrefs ? (
        <Loading />
      ) : prefs ? (
        <MainStack prefs={prefs} />
      ) : (
        <OnboardingScreen onDone={setPrefs} />
      )}
    </NavigationContainer>
  );
}
