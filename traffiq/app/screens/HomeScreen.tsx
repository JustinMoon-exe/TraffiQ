// HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { db, auth } from '../firebaseConfig';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [destination, setDestination] = useState<string>('');
  const [recentTrips, setRecentTrips] = useState<string[]>([]);
  const user = auth.currentUser;

  // Subscribe to the user's document so recentTrips updates automatically.
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRecentTrips(data.recentTrips || []);
      }
    }, (error) => {
      console.error("Error listening to recent trips:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSearch = async () => {
    if (!destination.trim()) return;
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          recentTrips: arrayUnion(destination)
        });
      } catch (error) {
        console.error("Error updating recent trips:", error);
      }
    }
    navigation.navigate('MapScreen', { destination });
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
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.tripItem} 
            onPress={() => navigation.navigate('MapScreen', { destination: item })}
          >
            <Text style={styles.tripText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 25,
  },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  searchButton: { backgroundColor: '#6200EE', padding: 12, borderRadius: 8, alignItems: 'center' },
  searchText: { color: '#fff', fontWeight: 'bold' },
  recentHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  tripItem: { padding: 10, backgroundColor: '#f2f2f2', marginTop: 5, borderRadius: 5 },
  tripText: { fontSize: 16 },
});

export default HomeScreen;
