import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { RootStackParamList, Coordinates } from "../types/types";


type NavigationScreenRouteProp = NativeStackNavigationProp<RootStackParamList, 'Navigation'>;
type MapDirectionMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';

interface RouteParams {
  mode: string;
  startCoords: Coordinates;
  destinationCoords: Coordinates;
  travelTime: number;
  destination: string;
  startAddress: string;
}

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;

const NavigationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationScreenRouteProp>();
  const { mode, startCoords, destinationCoords, travelTime, destination, startAddress } = route.params as RouteParams;

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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={{
            latitude: startCoords.latitude,
            longitude: startCoords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={startCoords} title="Start" description={startAddress} />
          <Marker coordinate={destinationCoords} title="Destination" description={destination} />
          <MapViewDirections
            origin={startCoords}
            destination={destinationCoords}
            apikey='AIzaSyBrsklzWqQijkHVivtGeYLUaXdXKVO6XIw'
            mode={mode.toUpperCase() as MapDirectionMode}
            strokeWidth={4}
            strokeColor="#6200EE"
          />
        </MapView>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailsText}>Mode: {mode.toUpperCase()}</Text>
        <Text style={styles.detailsText}>From: {startAddress}</Text>
        <Text style={styles.detailsText}>To: {destination}</Text>
        <Text style={styles.detailsText}>Estimated Time: {travelTime} minutes</Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveRoute}>
        <Text style={styles.saveButtonText}>Save Route</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 15,
    zIndex: 1,
    backgroundColor: '#6200EE',
    padding: 10,
    borderRadius: 8,
  },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
  mapContainer: { 
    flex: 1, 
    marginTop: 60,
    marginHorizontal: 10,
    borderRadius: 8, 
    overflow: 'hidden' 
  },
  map: { flex: 1 },
  detailsContainer: { 
    padding: 15, 
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    elevation: 2,
  },
  detailsText: { 
    fontSize: 16, 
    marginVertical: 5,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default NavigationScreen;
