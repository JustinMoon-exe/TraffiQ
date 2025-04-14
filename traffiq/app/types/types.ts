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
      travelTime: number;
      destination: string;
      startAddress: string;
    };
    SavedScreen: undefined;
    Main: undefined; // This corresponds to the TabNavigator
    // Note: BusScreen is NOT typically listed here unless you also want
    // to be able to navigate to it *outside* of the tabs.
  };

// --- Modifications Start Here ---
export type BottomTabParamList = {
    Explore: undefined;
    Saved: undefined;
    Bus: undefined; // <-- Add Bus route
    Settings: undefined;
};

export type IoniconName =
| 'location-outline'
| 'bookmark-outline'
| 'bus-outline' // <-- Add bus icon name
| 'settings-outline';
// --- Modifications End Here ---


// Navigation Prop types (These remain the same unless you add new top-level screens)
export type LogicScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Logic'>;
export type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;
export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>;
export type MapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MapScreen'>;
export type NavigationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NavigationScreen'>;
// You might add a prop type for navigation within the TabNavigator if needed,
// using createBottomTabNavigator's types, but it's often handled differently.