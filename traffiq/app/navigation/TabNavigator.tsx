// TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
// import { SafeAreaView } from 'react-native-safe-area-context'; // Removed as potentially redundant
import HomeScreen from '../screens/HomeScreen';
import SavedScreen from '../screens/SavedScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BusScreen from '../screens/BusScreen'; // Ensure path is correct
import { BottomTabParamList, IoniconName } from '../types'; // Ensure types are updated

const Tab = createBottomTabNavigator<BottomTabParamList>();

const tabIcons: Record<keyof BottomTabParamList, IoniconName> = {
  Explore: 'location-outline',
  Saved: 'bookmark-outline',
  Bus: 'bus-outline',
  Settings: 'settings-outline',
};

const TabNavigator = () => {
  return (
    // Removed SafeAreaView wrapper - test if this looks okay visually
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = tabIcons[route.name] || 'help-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          // Add any custom styles if needed
        },
        tabBarLabelStyle: {
          // Add any custom styles if needed
        }
      })}
    >
      {/* ONLY Tab.Screen components should be direct children */}
      <Tab.Screen name="Explore" component={HomeScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Bus" component={BusScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
    // Removed SafeAreaView closing tag
  );
};

export default TabNavigator;