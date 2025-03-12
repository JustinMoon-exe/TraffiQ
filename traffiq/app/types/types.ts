export type Coordinates = {
    latitude: number;
    longitude: number;
  };
  
export type RootStackParamList = {
    Home: undefined;
    Map: { destination?: string };
    Navigation: {
        mode: string;
        startCoords: Coordinates;
        destinationCoords: Coordinates;
        travelTime: number;
        destination: string;
        startAddress: string;
    };
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
  