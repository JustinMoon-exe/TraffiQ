import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';

// Screens
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import NavigationScreen from '../screens/NavigationScreen';
import SavedScreen from '../screens/SavedScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { RootStackParamList, BottomTabParamList, IoniconName } from '../types';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Explicit icon mapping with type safety
const tabIcons: Record<keyof BottomTabParamList, IoniconName> = {
  Explore: 'location-outline',
  Saved: 'bookmark-outline',
  Settings: 'settings-outline',
};

const ExploreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Map" component={MapScreen} />
    <Stack.Screen name="Navigation" component={NavigationScreen} />
  </Stack.Navigator>
);

const RootNavigator = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              const iconName = tabIcons[route.name];
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#6200EE',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
          })}
        >
          <Tab.Screen name="Explore" component={ExploreStack} />
          <Tab.Screen name="Saved" component={SavedScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default RootNavigator;