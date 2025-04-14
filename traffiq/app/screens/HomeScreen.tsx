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
      <Text style={styles.header}>Traffiq</Text>
      <TextInput
        style={styles.input}
        placeholder="Search for your destination..."
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
    backgroundColor: '#6C47FF', // Main background color adjusted to match image design
    paddingHorizontal: 15,
    paddingTop: 25,
  },
  header: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#fff', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  input: {
    borderWidth: 1,
    borderColor: '#fff',
    padding: 15,
    borderRadius: 25,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  searchButton: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 25, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  searchText: { 
    color: '#6200EE', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  recentHeader: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 10 
  },
  tripItem: { 
    padding: 12, 
    backgroundColor: '#fff', 
    marginTop: 10, 
    borderRadius: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 5, 
    elevation: 5 
  },
  tripText: { 
    fontSize: 16, 
    color: '#333' 
  },
});

export default HomeScreen;
