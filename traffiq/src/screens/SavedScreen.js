// src/screens/SavedScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SavedScreen = () => {
  const [savedRoutes, setSavedRoutes] = useState([]);

  useEffect(() => {
    const loadSavedRoutes = async () => {
      try {
        const storedRoutes = await AsyncStorage.getItem('savedRoutes');
        if (storedRoutes) {
          setSavedRoutes(JSON.parse(storedRoutes));
        }
      } catch (error) {
        console.error('Error loading saved routes:', error);
      }
    };
    loadSavedRoutes();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.routeItem}>
      <Text style={styles.routeText}>
        From: {item.startAddress}{'\n'}
        To: {item.destination}{'\n'}
        Mode: {item.mode}{'\n'}
        Travel Time: {item.travelTime} minutes{'\n'}
        Saved on: {new Date(item.timestamp).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Saved Routes</Text>
      <FlatList
        data={savedRoutes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  routeItem: {
    padding: 10,
    backgroundColor: '#f2f2f2',
    marginTop: 5,
    borderRadius: 8,
  },
  routeText: { fontSize: 16 },
});

export default SavedScreen;
