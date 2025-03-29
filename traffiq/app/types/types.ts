import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type Coordinates = {
    latitude: number;
    longitude: number;
  };

  export type RootStackParamList = {
    Logic: undefined;
    Login: undefined;
    Register: undefined;
    HomeScreen: undefined;
    MapScreen: { destination?: string };
    NavigationScreen: {
      mode: string;
      startCoords: Coordinates;
      destinationCoords: Coordinates;
      travelTime: number;
      destination: string;
      startAddress: string;
    };
    SavedScreen: undefined;
    Main: undefined;
  };

export type BottomTabParamList = {
    Explore: undefined;
    Saved: undefined;
    Settings: undefined;
};

export type IoniconName =
| 'location-outline'
| 'bookmark-outline'
| 'settings-outline';


export type LogicScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Logic'>;
export type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;
export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>; // Corrected to HomeScreen
export type MapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MapScreen'>; // Corrected to MapScreen
export type NavigationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NavigationScreen'>;
