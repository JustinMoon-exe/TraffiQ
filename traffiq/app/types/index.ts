import { Ionicons } from '@expo/vector-icons';

export type RootStackParamList = {
  Home: undefined;
  Map: { destination?: string };
  Navigation: {
    mode: string;
    startCoords: { latitude: number; longitude: number };
    destinationCoords: { latitude: number; longitude: number };
    travelTime: number;
    destination: string;
    startAddress: string;
  };
};

export type BottomTabParamList = {
  Explore: undefined;
  Saved: undefined;
  Bus: undefined; 
  Settings: undefined;
};

export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];