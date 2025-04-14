// TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native'; 
import HomeScreen from '../screens/HomeScreen';
import SavedScreen from '../screens/SavedScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BusScreen from '../screens/BusScreen';
import { BottomTabParamList, IoniconName } from '../types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const tabIcons: Record<keyof BottomTabParamList, IoniconName> = {
  Explore: 'location-outline',
  Saved: 'bookmark-outline',
  Bus: 'bus-outline',
  Settings: 'settings-outline',
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = tabIcons[route.name] || 'help-circle-outline';
          return <Ionicons name={iconName} size={size + 2} color={color} />;
        },
        tabBarActiveTintColor: '#483bcb', 
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 65, 
          paddingBottom: Platform.OS === 'ios' ? 30 : 5, 
          paddingTop: 5, 
          backgroundColor: '#FFFFFF', 
          borderTopWidth: 1, 
          borderTopColor: '#E0E0E0', 
        },
        tabBarLabelStyle: {
          marginBottom: Platform.OS === 'ios' ? 10: 10, 
          fontSize: 11, 
        },
        tabBarIconStyle: {
           marginTop: Platform.OS === 'ios' ? 0 : 2, 
        }
      })}
    >
      <Tab.Screen name="Explore" component={HomeScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Bus" component={BusScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;