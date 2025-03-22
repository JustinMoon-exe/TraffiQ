// TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import NavigationScreen from '../screens/NavigationScreen';
import SavedScreen from '../screens/SavedScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { BottomTabParamList, IoniconName } from '../types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const tabIcons: Record<keyof BottomTabParamList, IoniconName> = {
  Explore: 'location-outline',
  Saved: 'bookmark-outline',
  Settings: 'settings-outline',
};

const ExploreStack = () => (
  // Here you can define your explore stack (if you want Home, Map, Navigation to be in a stack)
  // For simplicity, we can have Home and Map in one stack.
  // Adjust as needed.
  // Alternatively, you can simply use MapScreen inside the tab.
  // This example assumes MapScreen is for route selection and NavigationScreen for live navigation.
  // You can adjust the structure based on your needs.
  null
);

const TabNavigator = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
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
        <Tab.Screen name="Explore" component={HomeScreen} />
        <Tab.Screen name="Saved" component={SavedScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

export default TabNavigator;
