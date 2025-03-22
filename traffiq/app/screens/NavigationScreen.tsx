import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { RootStackParamList, Coordinates } from '../types/types';

type NavigationScreenRouteProp = NativeStackNavigationProp<RootStackParamList, 'Navigation'>;

type MapDirectionMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';

interface RouteParams {
  mode: string;
  startCoords: Coordinates;
  destinationCoords: Coordinates;
  travelTime: number; // in minutes
  destination: string;
  startAddress: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyBrsklzWqQijkHVivtGeYLUaXdXKVO6XIw'

const NavigationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationScreenRouteProp>();
  const { mode, startCoords, destinationCoords, travelTime, destination, startAddress } = route.params as RouteParams;
  
  // State for fetched directions steps
  const [directionsSteps, setDirectionsSteps] = useState<any[]>([]);

  // Calculate ETA based on travelTime (minutes) added to current time
  const calculateETA = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + travelTime);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Fetch directions steps for turn-by-turn instructions
  useEffect(() => {
    const fetchDirections = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoords.latitude},${startCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=${mode.toLowerCase()}&key=${GOOGLE_MAPS_API_KEY}`
        );
        if (!response.ok) throw new Error('Failed to fetch directions');
        const data = await response.json();
        if (data.routes?.[0]?.legs?.[0]?.steps) {
          setDirectionsSteps(data.routes[0].legs[0].steps);
        } else {
          setDirectionsSteps([]);
        }
      } catch (error) {
        console.error('Directions fetch error:', error);
      }
    };
    fetchDirections();
  }, [startCoords, destinationCoords, mode]);

  const handleSaveRoute = async () => {
    const newRoute = {
      startAddress,
      destination,
      mode,
      travelTime,
      timestamp: new Date().toISOString(),
    };
    try {
      const storedRoutes = await AsyncStorage.getItem('savedRoutes');
      const savedRoutes = storedRoutes ? JSON.parse(storedRoutes) : [];
      savedRoutes.push(newRoute);
      await AsyncStorage.setItem('savedRoutes', JSON.stringify(savedRoutes));
      Alert.alert('Success', 'Route saved successfully!');
    } catch (error) {
      console.error('Error saving route:', error);
      Alert.alert('Error', 'Failed to save route');
    }
  };

  // Get current and next instructions (if available)
  const currentInstruction = directionsSteps[0]?.html_instructions
    ? directionsSteps[0].html_instructions.replace(/<[^>]+>/g, '')
    : 'No directions available';
  const nextInstruction = directionsSteps[1]?.html_instructions
    ? directionsSteps[1].html_instructions.replace(/<[^>]+>/g, '')
    : '';

  // Region for centering the map on the user’s start location
  const region: Region = {
    latitude: startCoords.latitude,
    longitude: startCoords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation={true}
      >
        <Marker coordinate={startCoords} title="Start" description={startAddress} />
        <Marker coordinate={destinationCoords} title="Destination" description={destination} />
        <MapViewDirections
          origin={startCoords}
          destination={destinationCoords}
          apikey={GOOGLE_MAPS_API_KEY}
          mode={mode.toUpperCase() as MapDirectionMode}
          strokeWidth={4}
          strokeColor="#6200EE"
        />
      </MapView>

      {/* Top Bar for ETA and Travel Time */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>ETA: {calculateETA()}</Text>
        <Text style={styles.topBarText}>Travel Time: {travelTime} mins</Text>
      </View>

      {/* Bottom Card for Turn-by-Turn Directions */}
      <View style={styles.bottomCard}>
        <Text style={styles.currentStep}>{currentInstruction}</Text>
        {nextInstruction ? (
          <Text style={styles.nextStep}>Next: {nextInstruction}</Text>
        ) : null}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveRoute}>
        <Text style={styles.saveButtonText}>Save Route</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(98, 0, 238, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  currentStep: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  nextStep: {
    fontSize: 16,
    color: '#777',
    marginTop: 5,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 15,
    backgroundColor: '#6200EE',
    padding: 10,
    borderRadius: 8,
  },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
  saveButton: {
    position: 'absolute',
    bottom: 140,
    right: 15,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default NavigationScreen;
