import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [destination, setDestination] = useState('');
  const [recentTrips, setRecentTrips] = useState([]);

  // Load recent trips from local storage
  useEffect(() => {
    const loadRecentTrips = async () => {
      try {
        const storedTrips = await AsyncStorage.getItem('recentTrips');
        if (storedTrips) {
          setRecentTrips(JSON.parse(storedTrips));
        }
      } catch (error) {
        console.error('Error loading recent trips:', error);
      }
    };
    loadRecentTrips();
  }, []);

  // Save new trip and navigate to map screen
  const handleSearch = async () => {
    if (!destination.trim()) return;

    const newTrips = [destination, ...recentTrips.slice(0, 4)]; // Keep only 5 recent trips
    setRecentTrips(newTrips);

    await AsyncStorage.setItem('recentTrips', JSON.stringify(newTrips));

    navigation.navigate('Map', { destination });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Where do you want to go?</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter destination..."
        value={destination}
        onChangeText={setDestination}
      />
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchText}>Search</Text>
      </TouchableOpacity>

      <Text style={styles.recentHeader}>Recent Trips</Text>
      <FlatList
        data={recentTrips}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.tripItem} onPress={() => navigation.navigate('Map', { destination: item })}>
            <Text style={styles.tripText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 10 },
  searchButton: { backgroundColor: '#6200EE', padding: 12, borderRadius: 8, alignItems: 'center' },
  searchText: { color: '#fff', fontWeight: 'bold' },
  recentHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  tripItem: { padding: 10, backgroundColor: '#f2f2f2', marginTop: 5, borderRadius: 5 },
  tripText: { fontSize: 16 },
});

export default HomeScreen;
