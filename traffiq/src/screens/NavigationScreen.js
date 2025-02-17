// src/screens/NavigationScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_MAPS_API_KEY } from '@env';

const NavigationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { mode, startCoords, destinationCoords, travelTime, destination, startAddress } = route.params;

  // Ensure we pass the proper mode format to MapViewDirections (e.g., "TRANSIT")
  const googleMode = mode.toUpperCase();

  if (!startCoords || !destinationCoords) {
    return <ActivityIndicator style={styles.loader} size="large" color="#6200EE" />;
  }

  const handleSaveRoute = async () => {
    const newRoute = {
      startAddress,
      destination,
      mode: googleMode,
      travelTime,
      timestamp: new Date().toISOString(),
    };
    try {
      const storedRoutes = await AsyncStorage.getItem('savedRoutes');
      const savedRoutes = storedRoutes ? JSON.parse(storedRoutes) : [];
      savedRoutes.push(newRoute);
      await AsyncStorage.setItem('savedRoutes', JSON.stringify(savedRoutes));
      Alert.alert('Success', 'Route saved successfully!');
    } catch (e) {
      console.error('Error saving route:', e);
      Alert.alert('Error', 'Failed to save the route.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      
      {/* Navigation Map */}
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
            apikey={GOOGLE_MAPS_API_KEY}
            mode={googleMode}
            strokeWidth={4}
            strokeColor="blue"
          />
        </MapView>
      </View>
      
      {/* Route Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsText}>Mode: {googleMode}</Text>
        <Text style={styles.detailsText}>Estimated Time: {travelTime} minutes</Text>
        <Text style={styles.detailsText}>Directions and route details are provided by Google.</Text>
      </View>
      
      {/* Save Route Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveRoute}>
        <Text style={styles.saveButtonText}>Save Route</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    padding: 10,
    backgroundColor: '#6200EE',
    alignSelf: 'flex-start',
    margin: 10,
    borderRadius: 8,
  },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
  mapContainer: { 
    flex: 1, 
    margin: 10, 
    borderRadius: 8, 
    overflow: 'hidden' 
  },
  map: { flex: 1 },
  detailsContainer: { 
    padding: 15, 
    backgroundColor: '#fff' 
  },
  detailsText: { 
    fontSize: 16, 
    marginVertical: 5 
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
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});

export default NavigationScreen;
