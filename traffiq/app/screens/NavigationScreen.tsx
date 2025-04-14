import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Dimensions
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Coordinates } from '../types/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationScreenRouteProp = NativeStackNavigationProp<RootStackParamList, 'NavigationScreen'>;

type MapDirectionMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';

interface RouteParams {
  mode: string;
  startCoords: Coordinates; 
  destinationCoords: Coordinates;
  travelTime: number; 
  destination: string;
  startAddress: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyBrsklzWqQijkHVivtGeYLUaXdXKVO6XIw';

const NavigationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationScreenRouteProp>();
  const {
    mode,
    startCoords: initialStartCoords,
    destinationCoords,
    travelTime: initialTravelTime,
    destination,
    startAddress: initialStartAddress,
  } = route.params as RouteParams;

  const [startCoords, setStartCoords] = useState<Coordinates>(initialStartCoords);
  const [startAddress, setStartAddress] = useState(initialStartAddress);
  const [directionsSteps, setDirectionsSteps] = useState<any[]>([]);
  const [currentTravelTime, setCurrentTravelTime] = useState(initialTravelTime);

  const mapRef = useRef<MapView>(null);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    let subscription: Location.LocationSubscription;
    const subscribeToLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Error', 'Location permission not granted');
          return;
        }
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000, 
            distanceInterval: 5, 
          },
          (location) => {
            const newCoords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setStartCoords(newCoords);
          }
        );
      } catch (error) {
        console.error('Location watch error:', error);
      }
    };

    subscribeToLocation();
    return () => {
      subscription && subscription.remove();
    };
  }, []);

  const fetchDirections = useCallback(async () => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoords.latitude},${startCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=${mode.toLowerCase()}&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (!response.ok) throw new Error('Failed to fetch directions');
      const data = await response.json();
      if (data.routes?.[0]?.legs?.[0]?.steps) {
        setDirectionsSteps(data.routes[0].legs[0].steps);
        const updatedTimeSec = data.routes[0].legs[0].duration.value;
        setCurrentTravelTime(Math.round(updatedTimeSec / 60));
      } else {
        setDirectionsSteps([]);
      }
    } catch (error) {
      console.error('Live directions fetch error:', error);
    }
  }, [startCoords, destinationCoords, mode]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchDirections();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [fetchDirections]);

  const calculateETA = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + currentTravelTime);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const centerMap = () => {
    if (mapRef.current) {
      const region: Region = {
        latitude: startCoords.latitude,
        longitude: startCoords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  const currentInstruction = directionsSteps[0]?.html_instructions
    ? directionsSteps[0].html_instructions.replace(/<[^>]+>/g, '')
    : 'No directions available';
  const nextInstruction = directionsSteps[1]?.html_instructions
    ? directionsSteps[1].html_instructions.replace(/<[^>]+>/g, '')
    : '';

  const region: Region = {
    latitude: startCoords.latitude,
    longitude: startCoords.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation={true}
      >
        <MapViewDirections
          origin={startCoords}
          destination={destinationCoords}
          apikey={GOOGLE_MAPS_API_KEY}
          mode={mode.toUpperCase() as MapDirectionMode}
          strokeWidth={4}
          strokeColor="#6200EE"
        />
      </MapView>

      <TouchableOpacity style={styles.floatingCenterButton} onPress={centerMap}>
        <Text style={styles.floatingCenterButtonText}>⦿</Text>
      </TouchableOpacity>

      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.infoContainer}>
          <Text style={styles.topBarText}>ETA: {calculateETA()}</Text>
          <Text style={styles.topBarText}>Travel: {currentTravelTime} mins</Text>
        </View>
      </SafeAreaView>

      <View style={styles.bottomCard}>
        <Text style={styles.currentStep}>{currentInstruction}</Text>
        {nextInstruction ? <Text style={styles.nextStep}>Next: {nextInstruction}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  floatingCenterButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    zIndex: 10,
  },
  floatingCenterButtonText: { fontSize: 24, color: '#6200EE' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(98, 0, 238, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    zIndex: 10,
  },
  backButton: { backgroundColor: '#6200EE', padding: 8, borderRadius: 6 },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  infoContainer: { alignItems: 'center' },
  topBarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  currentStep: { fontSize: 18, color: '#333', fontWeight: '600' },
  nextStep: { fontSize: 16, color: '#777', marginTop: 5 },
});

export default NavigationScreen;
