import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert,
  FlatList,
  ScrollView
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define a type for coordinates
type Coordinates = { latitude: number; longitude: number };

// Define your navigation parameters
type RootStackParamList = {
  MapScreen: { destination?: string };
  Navigation: {
    mode: string;
    startCoords: Coordinates;
    destinationCoords: Coordinates;
    travelTime: number; // in minutes
    destination: string;
    startAddress: string;
  };
};

type MapScreenRouteProp = RouteProp<RootStackParamList, 'MapScreen'>;
type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MapScreen'>;

// Modes
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

  // Selected mode and related states
  const [selectedMode, setSelectedMode] = useState<"DRIVING" | "WALKING" | "TRANSIT">("DRIVING");
  const [directionsSteps, setDirectionsSteps] = useState<any[]>([]);
  const [travelTimes, setTravelTimes] = useState<{ [key in "DRIVING" | "WALKING" | "TRANSIT"]?: number }>({});

  const initialDestination = route.params?.destination || '';
  console.log("[MapScreen] initialDestination:", initialDestination);

  // Subscribe to live location updates
  useEffect(() => {
    let subscription: Location.LocationSubscription;
    const startWatching = async () => {
      try {
        console.log("[Location] Requesting permissions...");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }
        console.log("[Location] Permissions granted. Starting location watch...");
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
            console.log("[Location] New location:", coords);
            setStartCoords(coords);
            if (isLocationLocked && mapRef.current) {
              const region: Region = { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 };
              mapRef.current.animateToRegion(region, 1000);
            }
          }
        );
        // Get the initial location
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        console.log("[Location] Initial location:", coords);
        setStartCoords(coords);
        const reverse = await Location.reverseGeocodeAsync(coords);
        console.log("[Location] Reverse geocode:", reverse);
        setStartAddress(
          reverse[0]?.street ? `${reverse[0].street}, ${reverse[0].city}` : 'My Location'
        );
      } catch (err) {
        console.error("[Location] Error:", err);
        setError('Failed to get current location');
      }
    };

    startWatching();
    return () => {
      if (subscription) {
        console.log("[Location] Unsubscribing from location updates");
        subscription.remove();
      }
    };
  }, [isLocationLocked]);

  // Fetch destination coordinates once
  useEffect(() => {
    const fetchDestination = async () => {
      if (!initialDestination) {
        console.log("[fetchDestination] No destination provided.");
        setLoading(false);
        return;
      }
      try {
        console.log("[fetchDestination] Fetching destination for:", initialDestination);
        setLoading(true);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(initialDestination)}&key=${API_KEY}`
        );
        console.log("[fetchDestination] Response status:", response.status);
        if (!response.ok) throw new Error('Destination lookup failed');
        const data = await response.json();
        console.log("[fetchDestination] Data received:", data);
        if (data.results?.[0]?.geometry?.location) {
          const { lat, lng } = data.results[0].geometry.location;
          console.log("[fetchDestination] Setting destinationCoords:", { latitude: lat, longitude: lng });
          setDestinationCoords({ latitude: lat, longitude: lng });
        } else {
          console.log("[fetchDestination] No geometry.location found.");
          setError('Invalid destination - no results');
          Alert.alert('Error', 'Could not find this location');
        }
      } catch (err) {
        console.error("[fetchDestination] Destination error:", err);
        setError('Invalid destination');
        Alert.alert('Error', 'Could not find this location');
      } finally {
        console.log("[fetchDestination] Setting loading to false.");
        setLoading(false);
      }
    };

    fetchDestination();
  }, [initialDestination]);

  // Fetch directions whenever mode or coordinates change
  useEffect(() => {
    const fetchDirections = async () => {
      if (!startCoords || !destinationCoords) {
        console.log("[fetchDirections] Missing coordinates:", { startCoords, destinationCoords });
        return;
      }
      try {
        console.log("[fetchDirections] Fetching directions with mode:", selectedMode);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoords.latitude},${startCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=${selectedMode.toLowerCase()}&key=${API_KEY}`
        );
        console.log("[fetchDirections] Response status:", response.status);
        if (!response.ok) {
          console.error("[fetchDirections] Response not OK");
          return;
        }
        const data = await response.json();
        console.log("[fetchDirections] Data received:", data);
        if (data.routes?.[0]?.legs?.[0]?.steps) {
          console.log("[fetchDirections] Setting directionsSteps with", data.routes[0].legs[0].steps.length, "steps");
          setDirectionsSteps(data.routes[0].legs[0].steps);
        } else {
          console.log("[fetchDirections] No steps found.");
          setDirectionsSteps([]);
        }
      } catch (err) {
        console.error("[fetchDirections] Directions error:", err);
      }
    };

    fetchDirections();
  }, [selectedMode, startCoords, destinationCoords]);

  // Fetch travel times for each mode
  useEffect(() => {
    const fetchTravelTimeForMode = async (mode: "DRIVING" | "WALKING" | "TRANSIT") => {
      if (!startCoords || !destinationCoords) {
        console.log(`[fetchTravelTimeForMode] Missing coords for mode ${mode}.`);
        return;
      }
      try {
        console.log(`[fetchTravelTimeForMode] Fetching travel time for mode: ${mode}`);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoords.latitude},${startCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=${mode.toLowerCase()}&key=${API_KEY}`
        );
        console.log(`[fetchTravelTimeForMode] Response status for ${mode}:`, response.status);
        if (!response.ok) {
          console.error(`[fetchTravelTimeForMode] Response not OK for mode: ${mode}`);
          return;
        }
        const data = await response.json();
        console.log(`[fetchTravelTimeForMode] Data received for mode ${mode}:`, data);
        const duration = data.routes?.[0]?.legs?.[0]?.duration?.value;
        console.log(`[fetchTravelTimeForMode] Duration for ${mode}:`, duration);
        return duration;
      } catch (err) {
        console.error(`[fetchTravelTimeForMode] Error for mode ${mode}:`, err);
        return undefined;
      }
    };

    const fetchAllTravelTimes = async () => {
      const times: { [key in "DRIVING" | "WALKING" | "TRANSIT"]?: number } = {};
      await Promise.all(
        TRANSPORT_MODES.map(async (mode) => {
          const time = await fetchTravelTimeForMode(mode);
          if (time !== undefined) {
            times[mode] = time;
          }
        })
      );
      console.log("[fetchAllTravelTimes] Setting travelTimes:", times);
      setTravelTimes(times);
    };

    fetchAllTravelTimes();
  }, [startCoords, destinationCoords]);

  if (error) {
    console.log("[MapScreen] Error encountered:", error);
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
    console.log("[MapScreen] Still loading or missing coords:", { loading, startCoords, destinationCoords });
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Finding best routes...</Text>
      </SafeAreaView>
    );
  }

  // Determine mode colors based on travel times
  const modeColors: { [key in "DRIVING" | "WALKING" | "TRANSIT"]?: string } = {};
  if (
    travelTimes["DRIVING"] !== undefined &&
    travelTimes["WALKING"] !== undefined &&
    travelTimes["TRANSIT"] !== undefined
  ) {
    const sorted = TRANSPORT_MODES.slice().sort((a, b) => (travelTimes[a]! - travelTimes[b]!));
    modeColors[sorted[0]] = '#4CAF50'; // fastest
    modeColors[sorted[1]] = '#FFC107'; // medium
    modeColors[sorted[2]] = '#F44336'; // slowest
    console.log("[MapScreen] Mode colors determined:", modeColors);
  } else {
    console.log("[MapScreen] Incomplete travel times; cannot determine mode colors.");
  }

  // Render mode selection buttons
  const renderModeButtons = () => (
    <View style={styles.modeButtonsContainer}>
      {TRANSPORT_MODES.map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.modeButton,
            selectedMode === mode && styles.modeButtonSelected,
            { backgroundColor: modeColors[mode] || '#ddd' }
          ]}
          onPress={() => {
            console.log(`[Mode Button] Setting selected mode to ${mode}`);
            setSelectedMode(mode);
          }}
        >
          <Text style={[styles.modeButtonText, selectedMode === mode && styles.modeButtonTextSelected]}>
            {mode}
          </Text>
          {travelTimes[mode] !== undefined && (
            <Text style={styles.modeTimeText}>
              {Math.round(travelTimes[mode]! / 60)} min
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render turn-by-turn directions (FlatList wrapped in a fixed-height container)
  const renderDirectionStep = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepIndex}>{index + 1}.</Text>
      <View style={styles.stepDetails}>
        <Text style={styles.stepInstruction}>{item.html_instructions.replace(/<[^>]+>/g, '')}</Text>
        <Text style={styles.stepMeta}>{item.distance?.text} | {item.duration?.text}</Text>
      </View>
    </View>
  );

  // Handle navigation to the live Navigation screen
  const handleStartNavigation = () => {
    if (!startCoords || !destinationCoords) return;
    const selectedTravelTime = travelTimes[selectedMode];
    if (!selectedTravelTime) {
      Alert.alert('Error', 'Travel time not available for the selected mode.');
      return;
    }
    navigation.navigate('Navigation', {
      mode: selectedMode,
      startCoords, // Ensure coords are properly serialized
      destinationCoords,
      travelTime: Math.round(selectedTravelTime / 60),
      destination: initialDestination,
      startAddress,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <SafeAreaView style={styles.topBar}>
        <Text style={styles.topBarText}>Current Mode: {selectedMode}</Text>
        <TouchableOpacity onPress={() => setIsLocationLocked(!isLocationLocked)}>
          <Text style={styles.topBarText}>{isLocationLocked ? 'Unlock Map' : 'Lock Map'}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Main Content */}
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
            initialRegion={{
              ...startCoords,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
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
        </View>
        {/* Mode Selection */}
        {renderModeButtons()}
        {/* Directions List */}
        <View style={styles.directionsContainer}>
          <Text style={styles.directionsHeader}>Turn-by-Turn Directions</Text>
          <View style={{ height: 200 }}>
            <FlatList
              data={directionsSteps}
              keyExtractor={(_, index) => index.toString()}
              renderItem={renderDirectionStep}
              nestedScrollEnabled={true}
            />
          </View>
        </View>
        {/* Start Navigation Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartNavigation}>
          <Text style={styles.startButtonText}>Start Navigation</Text>
        </TouchableOpacity>
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
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  topBarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
  modeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    width: 100,
  },
  modeButtonSelected: { borderWidth: 2, borderColor: '#333' },
  modeButtonText: { fontSize: 14, color: '#fff', fontWeight: '500' },
  modeButtonTextSelected: { color: '#fff' },
  modeTimeText: { fontSize: 12, color: '#fff', marginTop: 4 },
  directionsContainer: { marginTop: 10 },
  directionsHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#6200EE' },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
  },
  stepIndex: { fontWeight: 'bold', marginRight: 8, fontSize: 16 },
  stepDetails: { flex: 1 },
  stepInstruction: { fontSize: 15, marginBottom: 4, color: '#333' },
  stepMeta: { fontSize: 13, color: '#666' },
  startButton: {
    backgroundColor: '#6200EE',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#6200EE', fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#E53935', fontSize: 18, marginBottom: 20, textAlign: 'center' },
  retryButton: { color: '#6200EE', fontSize: 16, fontWeight: '600' },
});

export default MapScreen;
