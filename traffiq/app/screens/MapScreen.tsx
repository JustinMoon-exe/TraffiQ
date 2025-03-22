import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert,
  ScrollView
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList, Coordinates } from '../types/types';

type MapScreenRouteProp = RouteProp<RootStackParamList, 'MapScreen'>;
type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MapScreen'>;

const TRANSPORT_MODES: Array<"DRIVING" | "WALKING" | "TRANSIT"> = ["DRIVING", "WALKING", "TRANSIT"];
const API_KEY = "AIzaSyBrsklzWqQijkHVivtGeYLUaXdXKVO6XIw";

const MapScreen = () => {
  const route = useRoute<MapScreenRouteProp>();
  const navigation = useNavigation<MapScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);

  const [startAddress, setStartAddress] = useState('');
  const [startCoords, setStartCoords] = useState<Coordinates | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocationLocked, setIsLocationLocked] = useState(false);

  const [selectedMode, setSelectedMode] = useState<"DRIVING" | "WALKING" | "TRANSIT">("DRIVING");
  const [travelTimes, setTravelTimes] = useState<{ [key in "DRIVING" | "WALKING" | "TRANSIT"]?: number }>({});
  const [directionsSteps, setDirectionsSteps] = useState<any[]>([]);

  const initialDestination = route.params?.destination || '';
  console.log("[MapScreen] initialDestination:", initialDestination);

  // Subscribe to live location updates
  useEffect(() => {
    let subscription: Location.LocationSubscription;
    const startWatching = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (location) => {
            const coords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setStartCoords(coords);
            if (isLocationLocked && mapRef.current) {
              const region: Region = { ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 };
              mapRef.current.animateToRegion(region, 1000);
            }
          }
        );
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setStartCoords(coords);
        const reverse = await Location.reverseGeocodeAsync(coords);
        setStartAddress(
          reverse[0]?.street ? `${reverse[0].street}, ${reverse[0].city}` : 'My Location'
        );
      } catch (err) {
        console.error("Location error:", err);
        setError("Failed to get current location");
      }
    };

    startWatching();
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isLocationLocked]);

  // Fetch destination coordinates
  useEffect(() => {
    const fetchDestination = async () => {
      if (!initialDestination) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(initialDestination)}&key=${API_KEY}`
        );
        if (!response.ok) throw new Error('Destination lookup failed');
        const data = await response.json();
        if (data.results?.[0]?.geometry?.location) {
          const { lat, lng } = data.results[0].geometry.location;
          setDestinationCoords({ latitude: lat, longitude: lng });
        }
      } catch (err) {
        setError('Invalid destination');
        Alert.alert('Error', 'Could not find this location');
      } finally {
        setLoading(false);
      }
    };

    fetchDestination();
  }, [initialDestination]);

  // Define a function to fetch directions so it can be called on interval
  const fetchDirections = useCallback(async () => {
    if (!startCoords || !destinationCoords) return;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoords.latitude},${startCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=${selectedMode.toLowerCase()}&key=${API_KEY}`
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data.routes?.[0]?.legs?.[0]?.steps) {
        setDirectionsSteps(data.routes[0].legs[0].steps);
      } else {
        setDirectionsSteps([]);
      }
    } catch (err) {
      console.error("Directions error:", err);
    }
  }, [startCoords, destinationCoords, selectedMode]);

  // Poll for directions every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchDirections();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [fetchDirections]);

  // Fetch travel times for each mode
  useEffect(() => {
    const fetchTravelTimeForMode = async (mode: "DRIVING" | "WALKING" | "TRANSIT") => {
      if (!startCoords || !destinationCoords) return;
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoords.latitude},${startCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=${mode.toLowerCase()}&key=${API_KEY}`
        );
        if (!response.ok) return;
        const data = await response.json();
        const duration = data.routes?.[0]?.legs?.[0]?.duration?.value;
        return duration; // seconds
      } catch (err) {
        console.error(`Travel time error for ${mode}:`, err);
        return undefined;
      }
    };

    const fetchAllTravelTimes = async () => {
      const times: { [key in "DRIVING" | "WALKING" | "TRANSIT"]?: number } = {};
      for (const mode of TRANSPORT_MODES) {
        const t = await fetchTravelTimeForMode(mode);
        if (t !== undefined) times[mode] = t;
      }
      setTravelTimes(times);
    };

    fetchAllTravelTimes();
  }, [startCoords, destinationCoords]);

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.retryButton}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading || !startCoords || !destinationCoords) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Finding best routes...</Text>
      </SafeAreaView>
    );
  }

  // Tighter zoom region
  const region: Region = {
    latitude: startCoords.latitude,
    longitude: startCoords.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  // Center map handler
  const centerMap = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  // Determine color coding based on travel times (fastest = green, medium = yellow, slowest = red)
  const modeColors: { [key in "DRIVING" | "WALKING" | "TRANSIT"]?: string } = {};
  if (
    travelTimes.DRIVING !== undefined &&
    travelTimes.WALKING !== undefined &&
    travelTimes.TRANSIT !== undefined
  ) {
    const sorted = TRANSPORT_MODES.slice().sort((a, b) => (travelTimes[a]! - travelTimes[b]!));
    modeColors[sorted[0]] = '#4CAF50';
    modeColors[sorted[1]] = '#FFC107';
    modeColors[sorted[2]] = '#F44336';
  }

  // Start Navigation button handler
  const handleStartNavigation = () => {
    const selectedTravelTime = travelTimes[selectedMode];
    if (!selectedTravelTime) {
      Alert.alert('Error', 'Travel time not available for selected mode.');
      return;
    }
    navigation.navigate('Navigation', {
      mode: selectedMode,
      startCoords,
      destinationCoords,
      travelTime: Math.round(selectedTravelTime / 60),
      destination: initialDestination,
      startAddress,
    });
  };

  // Save Route button handler
  const handleSaveRoute = async () => {
    const newRoute = {
      startAddress,
      destination: initialDestination,
      mode: selectedMode,
      travelTime: Math.round((travelTimes[selectedMode] || 0) / 60),
      timestamp: new Date().toISOString(),
    };
    try {
      const storedRoutes = await AsyncStorage.getItem('savedRoutes');
      const savedRoutes = storedRoutes ? JSON.parse(storedRoutes) : [];
      savedRoutes.push(newRoute);
      await AsyncStorage.setItem('savedRoutes', JSON.stringify(savedRoutes));
      Alert.alert('Success', 'Route saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save route');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.infoContainer}>
          <Text style={styles.topBarText}>Current Mode: {selectedMode}</Text>
        </View>
        <TouchableOpacity style={styles.centerButton} onPress={centerMap}>
          <Text style={styles.centerButtonText}>Center</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Address Inputs */}
        <View style={styles.addressContainer}>
          <TextInput
            style={styles.addressInput}
            placeholder="Starting location"
            value={startAddress}
            onChangeText={setStartAddress}
            placeholderTextColor="#666"
          />
          <TextInput
            style={styles.addressInput}
            placeholder="Destination"
            value={initialDestination}
            editable={false}
            placeholderTextColor="#666"
          />
        </View>
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            showsUserLocation={true}
            followsUserLocation={isLocationLocked}
          >
            <Marker coordinate={startCoords} title="Start" />
            <Marker coordinate={destinationCoords} title="Destination" />
            <MapViewDirections
              origin={startCoords}
              destination={destinationCoords}
              apikey={API_KEY}
              mode={selectedMode}
              strokeWidth={3}
              strokeColor="#6200EE"
            />
          </MapView>
          {/* Floating Camera Center Button */}
          <TouchableOpacity style={styles.floatingCenterButton} onPress={centerMap}>
            <Text style={styles.floatingCenterButtonText}>⦿</Text>
          </TouchableOpacity>
        </View>
        {/* Mode Selection */}
        <View style={styles.modeButtonsContainer}>
          {TRANSPORT_MODES.map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                selectedMode === mode && styles.modeButtonSelected,
                { backgroundColor: mode === selectedMode ? modeColors[mode] || '#6200EE' : '#ddd' },
              ]}
              onPress={() => setSelectedMode(mode)}
            >
              <Text style={[styles.modeButtonText, selectedMode === mode && styles.modeButtonTextSelected]}>
                {mode}
              </Text>
              {travelTimes[mode] !== undefined && (
                <Text style={styles.modeTimeText}>{Math.round(travelTimes[mode]! / 60)} min</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {/* Bottom Buttons */}
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleStartNavigation}>
            <Text style={styles.actionButtonText}>Start Navigation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} onPress={handleSaveRoute}>
            <Text style={styles.actionButtonText}>Save Route</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
    paddingVertical: 5,
    zIndex: 10,
  },
  backButton: { padding: 8, backgroundColor: '#6200EE', borderRadius: 6 },
  backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  infoContainer: { alignItems: 'center' },
  topBarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  centerButton: { padding: 8, backgroundColor: '#fff', borderRadius: 6 },
  centerButtonText: { color: '#6200EE', fontWeight: '600', fontSize: 14 },
  contentContainer: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 20 },
  addressContainer: { marginBottom: 10 },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  mapContainer: { height: 300, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  map: { flex: 1 },
  floatingCenterButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  floatingCenterButtonText: { fontSize: 24, color: '#6200EE' },
  modeButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  modeButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignItems: 'center', width: 100 },
  modeButtonSelected: { borderWidth: 2, borderColor: '#333' },
  modeButtonText: { fontSize: 14, color: '#fff', fontWeight: '500' },
  modeButtonTextSelected: { color: '#fff' },
  modeTimeText: { fontSize: 12, color: '#fff', marginTop: 4 },
  bottomButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  actionButton: { backgroundColor: '#6200EE', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 8, flex: 1, marginHorizontal: 5, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#6200EE', fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#E53935', fontSize: 18, marginBottom: 20, textAlign: 'center' },
  retryButton: { color: '#6200EE', fontSize: 16, fontWeight: '600' },
});

export default MapScreen;
