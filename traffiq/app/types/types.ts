// types.ts
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
      travelTime: number; // Expected in minutes
      destination: string;
      startAddress: string;
      // Optional parameters for custom routes
      isCustomRoute?: boolean;
      customDirections?: string[];
      customPolyline?: Coordinates[];
    };
    SavedScreen: undefined;
    Main: undefined; 
  };

export type BottomTabParamList = {
    Explore: undefined;
    Saved: undefined;
    Bus: undefined; 
    Settings: undefined;
};

export interface CustomRouteData {
  id: string;
  startName: string; 
  destinationName: string; 
  startCoords: Coordinates; 
  polyline: Coordinates[]; 
  directions: string[];   
  estimatedTime: number; 
};

export type IoniconName =
| 'location-outline'
| 'bookmark-outline'
| 'bus-outline'
| 'settings-outline';


export type LogicScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Logic'>;
export type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;
export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>;
export type MapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MapScreen'>;
export type NavigationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NavigationScreen'>;
