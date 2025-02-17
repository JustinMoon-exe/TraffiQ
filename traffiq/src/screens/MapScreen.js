// src/screens/MapScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from '@env';

const MapScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  // Get the destination passed from HomeScreen, if any
  const initialDestination = route.params?.destination || '';
  
  // Editable starting location state
  const [startAddress, setStartAddress] = useState('');
  const [startCoords, setStartCoords] = useState(null);
  
  // Destination state
  const [destination, setDestination] = useState(initialDestination);
  const [destinationCoords, setDestinationCoords] = useState(null);
  
  // Travel options will be an object like: { driving: { time, color }, walking: { time, color }, transit: { time, color } }
  const [travelOptions, setTravelOptions] = useState(null);
  
  // 1. Get current location to initialize starting coords and default start address
  useEffect(() => {
    const getCurrentLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setStartCoords(coords);
        // Reverse geocode to get a default starting address
        const reverse = await Location.reverseGeocodeAsync(coords);
        if (reverse && reverse.length > 0) {
          const addr = `${reverse[0].street}, ${reverse[0].city}`;
          setStartAddress(addr);
        } else {
          setStartAddress('My Location');
        }
      } else {
        console.log('Location permission denied');
      }
    };
    getCurrentLocation();
  }, []);
  
  // 2. If the user modifies the start address, fetch new coordinates
  useEffect(() => {
    if (!startAddress) return;
    const fetchStartCoords = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(startAddress)}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;
          setStartCoords({ latitude: lat, longitude: lng });
        }
      } catch (error) {
        console.error('Error fetching start coordinates:', error);
      }
    };
    fetchStartCoords();
  }, [startAddress]);
  
  // 3. When destination text changes, fetch destination coordinates
  useEffect(() => {
    if (!destination) return;
    const fetchDestinationCoords = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;
          setDestinationCoords({ latitude: lat, longitude: lng });
        }
      } catch (error) {
        console.error('Error fetching destination coordinates:', error);
      }
    };
    fetchDestinationCoords();
  }, [destination]);
  
  // 4. Once both start and destination coordinates are available, fetch accurate travel times via the Directions API
  useEffect(() => {
    if (!startCoords || !destinationCoords) return;
    
    const fetchTravelTime = async (mode) => {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startCoords.latitude},${startCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const duration = data.routes[0].legs[0].duration.value; // in seconds
          return Math.round(duration / 60); // convert to minutes
        } else {
          return null;
        }
      } catch (e) {
        console.error(e);
        return null;
      }
    };

    const fetchAllTravelTimes = async () => {
      const modes = ['driving', 'walking', 'transit'];
      const results = await Promise.all(modes.map(mode => fetchTravelTime(mode)));
      const timesObj = {
        driving: results[0],
        walking: results[1],
        transit: results[2],
      };
      
      // Filter out modes that returned null
      const validModes = modes.filter(mode => timesObj[mode] !== null);
      if (validModes.length === 0) return;
      
      // Sort modes by travel time (fastest first)
      const sortedModes = [...validModes].sort((a, b) => timesObj[a] - timesObj[b]);
      const colorMapping = {};
      colorMapping[sortedModes[0]] = 'green';
      if (sortedModes[1]) colorMapping[sortedModes[1]] = 'yellow';
      if (sortedModes[2]) colorMapping[sortedModes[2]] = 'red';
      
      setTravelOptions({
        driving: { time: timesObj['driving'], color: colorMapping['driving'] || 'gray' },
        walking: { time: timesObj['walking'], color: colorMapping['walking'] || 'gray' },
        transit: { time: timesObj['transit'], color: colorMapping['transit'] || 'gray' },
      });
    };

    fetchAllTravelTimes();
  }, [startCoords, destinationCoords]);
  
  if (!startCoords || !destinationCoords || !travelOptions) {
    return <ActivityIndicator style={styles.loader} size="large" color="#6200EE" />;
  }
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Address fields */}
      <View style={styles.addressContainer}>
        <TextInput
          style={styles.addressInput}
          value={startAddress}
          onChangeText={setStartAddress}
          placeholder="Starting location"
        />
        <TextInput
          style={styles.addressInput}
          value={destination}
          onChangeText={setDestination}
          placeholder="Destination"
        />
      </View>
      
      {/* Map preview */}
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
          <Marker coordinate={startCoords} title="Start" />
          <Marker coordinate={destinationCoords} title="Destination" />
          <MapViewDirections
            origin={startCoords}
            destination={destinationCoords}
            apikey={GOOGLE_MAPS_API_KEY}
            mode="driving"  // Preview using driving mode
            strokeWidth={3}
            strokeColor="blue"
          />
        </MapView>
      </View>
      
      {/* Transit options grid */}
      <View style={styles.optionsContainer}>
        {['driving', 'walking', 'transit'].map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.optionButton, { backgroundColor: travelOptions[mode].color }]}
            onPress={() =>
              navigation.navigate('Navigation', {
                mode,
                startCoords,
                destinationCoords,
                travelTime: travelOptions[mode].time,
                destination,
                startAddress,
              })
            }
          >
            <Text style={styles.optionText}>{mode.toUpperCase()}</Text>
            <Text style={styles.optionText}>{travelOptions[mode].time} min</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  addressContainer: { 
    marginBottom: 15 
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  mapContainer: { 
    height: 300, 
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: { 
    flex: 1 
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  optionButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});

export default MapScreen;
