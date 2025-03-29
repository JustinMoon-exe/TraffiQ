// SavedScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

type SavedScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SavedScreen'>;

interface SavedRoute {
  startAddress: string;
  destination: string;
  mode: string;
  travelTime: number;
  timestamp: string;
}

const SavedScreen = () => {
  const navigation = useNavigation<SavedScreenNavigationProp>();
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const fetchSavedRoutes = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSavedRoutes(data.savedRoutes || []);
        }
      } catch (error) {
        console.error('Error fetching saved routes:', error);
      }
    };
    fetchSavedRoutes();
  }, [user]);

  const handleRoutePress = (route: SavedRoute) => {
    navigation.navigate('MapScreen', { destination: route.destination });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Saved Routes</Text>
      <FlatList
        data={savedRoutes}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.routeItem} 
            onPress={() => handleRoutePress(item)}
          >
            <Text style={styles.routeTitle}>{item.destination}</Text>
            <Text style={styles.routeDetail}>From: {item.startAddress}</Text>
            <Text style={styles.routeDetail}>Mode: {item.mode.toUpperCase()}</Text>
            <Text style={styles.routeDetail}>Duration: {item.travelTime} mins</Text>
            <Text style={styles.routeDate}>{formatDate(item.timestamp)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No saved routes found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: '#6200EE',
  },
  routeItem: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  routeDetail: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  routeDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontSize: 16,
  },
});

export default SavedScreen;
