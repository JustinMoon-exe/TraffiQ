import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  FlatList
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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
    travelTime: number;
    destination: string;
    startAddress: string;
  };
};

// Route and navigation props for MapScreen
type MapScreenRouteProp = RouteProp<RootStackParamList, 'MapScreen'>;
type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MapScreen'>;

// Use uppercase mode values as expected by MapViewDirections
const TRANSPORT_MODES: Array<"DRIVING" | "WALKING" | "TRANSIT"> = ["DRIVING", "WALKING", "TRANSIT"];

// Define a constant for your API key (set this once and use it throughout)
const API_KEY = "AIzaSyBrsklzWqQijkHVivtGeYLUaXdXKVO6XIw";

const MapScreen = () => {
  const route = useRoute<MapScreenRouteProp>();
  const navigation = useNavigation<MapScreenNavigationProp>();

  console.log("MapViewDirections:", MapViewDirections);

  const [startAddress, setStartAddress] = useState('');
  const [startCoords, setStartCoords] = useState<Coordinates | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the selected transport mode (use uppercase values)
  const [selectedMode, setSelectedMode] = useState<"DRIVING" | "WALKING" | "TRANSIT">("DRIVING");
  // State for turn-by-turn directions steps (if you choose to display them)
  const [directionsSteps, setDirectionsSteps] = useState<any[]>([]);

  // Retrieve destination from route params (if provided)
  const initialDestination = route.params?.destination || '';

  // Get current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        console.log("Requesting location permissions...");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }
        console.log("Fetching current position...");
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        console.log("Current position obtained:", coords);
        setStartCoords(coords);
        const reverse = await Location.reverseGeocodeAsync(coords);
        console.log("Reverse geocode result:", reverse);
        setStartAddress(
          reverse[0]?.street ? `${reverse[0].street}, ${reverse[0].city}` : 'My Location'
        );
      } catch (err) {
        console.error('Location error:', err);
        setError('Failed to get current location');
      }
    };
    getCurrentLocation();
  }, []);

  // Fetch destination coordinates
  useEffect(() => {
    const fetchDestination = async () => {
      if (!initialDestination) {
        console.log("No destination provided.");
        return;
      }
      try {
        setLoading(true);
        console.log("Fetching destination geocode for:", initialDestination);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(initialDestination)}&key=${API_KEY}`
        );
        if (!response.ok) throw new Error('Destination lookup failed');
        const data = await response.json();
        console.log("Destination geocode response:", data);
        if (data.results?.[0]?.geometry?.location) {
          const { lat, lng } = data.results[0].geometry.location;
          setDestinationCoords({ latitude: lat, longitude: lng });
        }
      } catch (err) {
        console.error('Destination error:', err);
        setError('Invalid destination');
        Alert.alert('Error', 'Could not find this location');
      } finally {
        setLoading(false);
      }
    };

    fetchDestination();
  }, [initialDestination]);

  // Fetch detailed directions for the selected mode
  useEffect(() => {
    const fetchDirections = async () => {
      if (!startCoords || !destinationCoords) {
        console.log("Cannot fetch directions: missing coordinates");
        return;
      }
      try {
        console.log(`Fetching directions for mode: ${selectedMode}`);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoords.latitude},${startCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=${selectedMode.toLowerCase()}&key=${API_KEY}`
        );
        if (!response.ok) {
          console.log("Directions API call failed");
          return;
        }
        const data = await response.json();
        console.log("Fetched directions data:", data);
        if (data.routes?.[0]?.legs?.[0]?.steps) {
          setDirectionsSteps(data.routes[0].legs[0].steps);
        } else {
          setDirectionsSteps([]);
        }
      } catch (err) {
        console.error('Directions error:', err);
      }
    };

    fetchDirections();
  }, [selectedMode, startCoords, destinationCoords]);

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

  // Render mode selection buttons
  const renderModeButtons = () => (
    <View style={styles.modeButtonsContainer}>
      {TRANSPORT_MODES.map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.modeButton,
            selectedMode === mode && styles.modeButtonSelected
          ]}
          onPress={() => setSelectedMode(mode)}
        >
          <Text style={[
            styles.modeButtonText,
            selectedMode === mode && styles.modeButtonTextSelected
          ]}>
            {mode}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render turn-by-turn directions steps in a FlatList
  const renderDirectionStep = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepIndex}>{index + 1}.</Text>
      <View style={styles.stepDetails}>
        <Text style={styles.stepInstruction}>
          {item.html_instructions.replace(/<[^>]+>/g, '')}
        </Text>
        <Text style={styles.stepMeta}>
          {item.distance?.text} | {item.duration?.text}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
            style={styles.map}
            initialRegion={{
              ...startCoords,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
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
          {directionsSteps.length > 0 ? (
            <FlatList
              data={directionsSteps}
              keyExtractor={(_, index) => index.toString()}
              renderItem={renderDirectionStep}
            />
          ) : (
            <Text style={styles.noDirectionsText}>No directions available.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { padding: 16 },
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
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ddd',
  },
  modeButtonSelected: {
    backgroundColor: '#6200EE',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  modeButtonTextSelected: {
    color: '#fff',
  },
  directionsContainer: { marginTop: 10 },
  directionsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#6200EE',
  },
  noDirectionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
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
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#6200EE', fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#E53935', fontSize: 18, marginBottom: 20, textAlign: 'center' },
  retryButton: { color: '#6200EE', fontSize: 16, fontWeight: '600' },
});

export default MapScreen;
