// HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Image,
  StatusBar,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, HomeScreenNavigationProp as NavigationPropType } from '../types';
import { db, auth } from '../firebaseConfig';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [destination, setDestination] = useState<string>('');
  const [recentTrips, setRecentTrips] = useState<string[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRecentTrips(Array.isArray(data.recentTrips) ? data.recentTrips : []);
      } else {
          console.log("User document does not exist!");
          setRecentTrips([]);
      }
    }, (error) => {
      console.error("Error listening to recent trips:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSearch = async () => {
    const trimmedDestination = destination.trim();
    if (!trimmedDestination) return;

    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          recentTrips: arrayUnion(trimmedDestination)
        });
      } catch (error) {
        console.error("Error updating recent trips:", error);
      }
    } else {
        console.log("No user logged in, navigating without saving trip.");
    }
    navigation.navigate('MapScreen', { destination: trimmedDestination });
  };

  const renderTripItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.tripItemTouchable}
      onPress={() => {
          console.log("Navigating to map with recent trip:", item);
          navigation.navigate('MapScreen', { destination: item })
      }}
      activeOpacity={0.6}
    >
      <Text style={styles.tripText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.backgroundView}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <SafeAreaView style={styles.safeAreaContent}>
        <View style={styles.container}>
          <Image
            source={require('../../assets/traffiq.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search destinations..."
              placeholderTextColor="#666"
              value={destination}
              onChangeText={setDestination}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch}>
               <Ionicons name="search" size={20} color="#333" style={styles.searchIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Trips</Text>
            <FlatList
              data={recentTrips}
              renderItem={renderTripItem}
              keyExtractor={(item, index) => `${item}-${index}`}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContentContainer}
              ListEmptyComponent={<Text style={styles.emptyListText}>No recent trips found.</Text>}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundView: {
    flex: 1,
    backgroundColor: '#483bcb',
  },
  safeAreaContent: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 120,
    paddingBottom: 15,
  },
  logo: {
    width: '70%',
    height: 80,
    alignSelf: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0dae7',
    borderRadius: 50,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 5,
  },
  searchIcon: {
    marginLeft: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listContentContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      flexGrow: 1,
  },
  tripItemTouchable: {
      paddingVertical: 15,
  },
  tripText: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
      height: 1,
      backgroundColor: '#e5e5e5',
  },
  emptyListText: {
      textAlign: 'center',
      marginTop: 20,
      fontSize: 14,
      color: '#888',
  }
});

export default HomeScreen;