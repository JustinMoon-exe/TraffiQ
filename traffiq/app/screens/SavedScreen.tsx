// SavedScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setError("Please log in to view saved routes.");
      setLoading(false);
      setSavedRoutes([]);
      return;
    }

    setLoading(true);
    setError(null);
    const userDocRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const routes = Array.isArray(data.savedRoutes) ? data.savedRoutes : [];
        routes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setSavedRoutes(routes);
        setError(null);
      } else {
        console.log("User document doesn't exist for saved routes.");
        setSavedRoutes([]);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error listening to saved routes:', err);
      setError("Could not load saved routes. Please try again later.");
      setLoading(false);
    });

    return () => unsubscribe();

  }, [user]);

  const handleRoutePress = (route: SavedRoute) => {
    console.log("Navigating to map with saved route:", route.destination);
    navigation.navigate('MapScreen', { destination: route.destination });
  };

  const formatDate = (timestamp: string) => {
    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            return "Invalid date";
        }
        return date.toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Unknown date";
    }
  };

  const renderRouteItem = ({ item }: { item: SavedRoute }) => (
    <TouchableOpacity
      style={styles.routeItem}
      onPress={() => handleRoutePress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.routeTitle} numberOfLines={1}>{item.destination}</Text>
      <Text style={styles.routeDetail} numberOfLines={1}>From: {item.startAddress}</Text>
      <View style={styles.detailRow}>
         <Text style={styles.routeDetail}>Mode: {item.mode?.toUpperCase() || 'N/A'}</Text>
         <Text style={styles.routeDetail}>Duration: {item.travelTime || '?'} mins</Text>
      </View>
      <Text style={styles.routeDate}>{formatDate(item.timestamp)}</Text>
    </TouchableOpacity>
  );


  return (
    <View style={styles.backgroundView}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.safeAreaContent}>
        <View style={styles.container}>
          <Text style={styles.header}>Saved Routes</Text>

          <View style={styles.card}>
            {loading && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#483bcb" />
              </View>
            )}

            {!loading && error && (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {!loading && !error && (
              <FlatList
                data={savedRoutes}
                renderItem={renderRouteItem}
                keyExtractor={(item, index) => item.timestamp || index.toString()}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.listContentContainer}
                ListEmptyComponent={
                  <View style={styles.centered}>
                     <Text style={styles.emptyText}>No saved routes found.</Text>
                     <Text style={styles.emptySubText}>Routes you save from the map screen will appear here.</Text>
                  </View>
                }
              />
            )}
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
    paddingBottom: 15,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: Platform.OS === 'ios' ? 40 : 90,
    marginBottom: 20,
    textAlign: 'center',
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
  listContentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  routeItem: {
    paddingVertical: 15,
    paddingHorizontal: 0,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  routeDetail: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 3,
  },
  routeDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#eef0f2',
  },
  centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  emptySubText: {
     textAlign: 'center',
     color: '#888',
     fontSize: 14,
  },
  errorText: {
      textAlign: 'center',
      color: '#D32F2F',
      fontSize: 16,
  }
});

export default SavedScreen;