// SavedScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView, // Import SafeAreaView
  StatusBar,    // Import StatusBar
  Platform,     // Import Platform
  ActivityIndicator // Import ActivityIndicator for loading state
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types'; // Assuming RootStackParamList is defined correctly
import { db, auth } from '../firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore'; // Import onSnapshot if real-time updates are desired

// Use the specific navigation prop type
type SavedScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SavedScreen'>;

// Interface for the data structure in Firestore
interface SavedRoute {
  startAddress: string;
  destination: string;
  mode: string;
  travelTime: number;
  timestamp: string; // Assuming timestamp is stored as ISO string
  // Add coordinates if they are stored and needed for navigation later
  // startCoords?: Coordinates;
  // destinationCoords?: Coordinates;
}

const SavedScreen = () => {
  const navigation = useNavigation<SavedScreenNavigationProp>();
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state
  const user = auth.currentUser;

  // --- Fetch Saved Routes Logic (Using onSnapshot for real-time updates) ---
  useEffect(() => {
    if (!user) {
      setError("Please log in to view saved routes.");
      setLoading(false);
      setSavedRoutes([]); // Clear routes if user logs out
      return;
    }

    setLoading(true); // Start loading when user is available
    setError(null); // Clear previous errors
    const userDocRef = doc(db, "users", user.uid);

    // Use onSnapshot to listen for real-time changes
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure savedRoutes is always an array and sort by timestamp descending
        const routes = Array.isArray(data.savedRoutes) ? data.savedRoutes : [];
        routes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort newest first
        setSavedRoutes(routes);
        setError(null); // Clear error on successful fetch
      } else {
        console.log("User document doesn't exist for saved routes.");
        setSavedRoutes([]); // User exists but no doc? Clear routes.
      }
      setLoading(false); // Stop loading after fetch/update
    }, (err) => { // Handle errors during listening
      console.error('Error listening to saved routes:', err);
      setError("Could not load saved routes. Please try again later.");
      setLoading(false); // Stop loading on error
    });

    // Cleanup function to unsubscribe when component unmounts or user changes
    return () => unsubscribe();

  }, [user]); // Re-run effect if user changes

  // --- Navigation Handler ---
  const handleRoutePress = (route: SavedRoute) => {
    console.log("Navigating to map with saved route:", route.destination);
    // Navigate to MapScreen, passing only the destination name for now
    // If you stored coordinates, you could potentially pass them too
    // to skip the geocoding step on the MapScreen
    navigation.navigate('MapScreen', { destination: route.destination });
  };

  // --- Date Formatting Helper ---
  const formatDate = (timestamp: string) => {
    try {
        const date = new Date(timestamp);
        // Check if date is valid before formatting
        if (isNaN(date.getTime())) {
            return "Invalid date";
        }
        // More readable format
        return date.toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Unknown date";
    }
  };

  // --- Render Item Function for FlatList ---
  const renderRouteItem = ({ item }: { item: SavedRoute }) => (
    <TouchableOpacity
      style={styles.routeItem}
      onPress={() => handleRoutePress(item)}
      activeOpacity={0.7} // Provide visual feedback on press
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
    // --- Apply themed structure ---
    <View style={styles.backgroundView}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.safeAreaContent}>
        <View style={styles.container}>
          {/* --- Themed Header --- */}
          <Text style={styles.header}>Saved Routes</Text>

          {/* --- Card for the List --- */}
          <View style={styles.card}>
            {/* --- Loading State --- */}
            {loading && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#483bcb" />
              </View>
            )}

            {/* --- Error State --- */}
            {!loading && error && (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                     {/* Optional: Add a retry button */}
                     {/* <TouchableOpacity onPress={fetchSavedRoutes}> ... </TouchableOpacity> */}
                </View>
            )}

            {/* --- List Display (only when not loading and no error) --- */}
            {!loading && !error && (
              <FlatList
                data={savedRoutes}
                renderItem={renderRouteItem}
                keyExtractor={(item, index) => item.timestamp || index.toString()} // Use timestamp if available
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

// --- Styles incorporating the theme ---
const styles = StyleSheet.create({
  backgroundView: { // Outermost container with theme background
    flex: 1,
    backgroundColor: '#483bcb', // Match other screens
  },
  safeAreaContent: { // Handles padding for notches/bars
    flex: 1,
  },
  container: { // Inner container for content layout
    flex: 1,
    paddingHorizontal: 25, // Consistent horizontal padding
    paddingBottom: 15, // Space at bottom
    // paddingTop removed, safe area handles top
  },
  header: { // Themed header text
    fontSize: 28, // Larger header
    fontWeight: 'bold',
    color: '#FFFFFF', // White text
    marginTop: Platform.OS === 'ios' ? 40 : 90, // Adjust top margin after safe area
    marginBottom: 20, // Space below header
    textAlign: 'center', // Center header text
  },
  card: { // White card containing the list
    flex: 1, // Take remaining space
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    overflow: 'hidden', // Clip list content
  },
  listContentContainer: { // Padding inside the FlatList within the card
    padding: 20,
    flexGrow: 1, // Help content (like empty state) fill the card
  },
  routeItem: { // Styling for each saved route item
    paddingVertical: 15,
    paddingHorizontal: 0, // Padding handled by list container
    // Remove background color and elevation, use separator instead
  },
  routeTitle: { // Destination text
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  routeDetail: { // Other details (From, Mode, Duration)
    fontSize: 14,
    color: '#555', // Slightly darker grey
    lineHeight: 20, // Improve readability
  },
  detailRow: { // Arrange Mode and Duration side-by-side
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 3,
  },
  routeDate: { // Timestamp text
    fontSize: 12,
    color: '#999', // Light grey
    marginTop: 8,
  },
  separator: { // Line between items
    height: 1,
    backgroundColor: '#eef0f2', // Lighter separator
  },
  centered: { // Utility for centering loading/empty/error states
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  emptyText: { // Text for empty list
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  emptySubText: { // Additional text for empty list
     textAlign: 'center',
     color: '#888',
     fontSize: 14,
  },
  errorText: { // Text for error message
      textAlign: 'center',
      color: '#D32F2F', // Reddish error color
      fontSize: 16,
  }
});

export default SavedScreen;