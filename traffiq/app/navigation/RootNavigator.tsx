// RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LogicScreen from '../screens/LogicScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigator from './TabNavigator';
import MapScreen from '../screens/MapScreen';
import HomeScreen from '../screens/HomeScreen';
import SavedScreen from '../screens/SavedScreen';
import NavigationScreen from '../screens/NavigationScreen';  
import BusScreen from '../screens/BusScreen';

export type RootStackParamList = {
  Logic: undefined;
  Login: undefined;
  Register: undefined;
  HomeScreen: undefined;
  MapScreen: { destination?: string };
  NavigationScreen: {
    mode: string;
    startCoords: { latitude: number; longitude: number };
    destinationCoords: { latitude: number; longitude: number };
    travelTime: number;
    destination: string;
    startAddress: string;
  };
  SavedScreen: undefined;
  Main: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => (
  <NavigationContainer>
    <RootStack.Navigator initialRouteName="Logic" screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Logic" component={LogicScreen} />
      <RootStack.Screen name="HomeScreen" component={HomeScreen} />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Register" component={RegisterScreen} />
      <RootStack.Screen name="Main" component={TabNavigator} />
      <RootStack.Screen name="MapScreen" component={MapScreen} />
      <RootStack.Screen name="NavigationScreen" component={NavigationScreen} />
      <RootStack.Screen name="SavedScreen" component={SavedScreen} />
    </RootStack.Navigator>
  </NavigationContainer>
);

export default RootNavigator;
