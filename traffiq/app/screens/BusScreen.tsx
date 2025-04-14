// BusScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  UIManager,
  Platform,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Types (Keep as is) ---
interface BusRoute {
  id: string;
  name: string;
  shortName: string | null;
  polyline: { latitude: number; longitude: number }[];
}

interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routesAndPositions: { [routeId: string]: number[] };
}

interface LiveBus {
  id: string; // Vehicle ID
  name: string; // Vehicle name/number
  latitude: number;
  longitude: number;
  speed: number;
  routeId: string | null;
  routeName: string;
  color: string; // Keep for potential future use (e.g., live bus icons)
}

// --- Constants (Keep as is) ---
const API_BASE = 'http://10.0.2.2:8000/api/bus';
const PROXIMITY_THRESHOLD = 0.0005;

// --- NEW: Color Name Mapping Logic ---
// Define common color keywords and their corresponding hex codes
const ROUTE_NAME_COLOR_MAP: { [key: string]: string } = {
    green: '#caffca',   // Material Green
    blue: '#2196F3',    // Material Blue
    red: '#f5a5a5',     // Material Red
    purple: '#9b99ff',  // Material Purple
    orange: '#FF9800',  // Material Orange
    yellow: '#FFC107',  // Material Amber (better contrast than pure yellow)
    pink: '#E91E63',    // Material Pink
    silver: '#BDBDBD',  // Material Grey 400
    gold: '#FFD700',
    brown: '#795548',   // Material Brown
    black: '#212121',   // Material Grey 900

};
const DEFAULT_ROUTE_COLOR = '#9E9E9E'; // Material Grey 500 (Default Grey)

// Function to get color based on route name
const getColorFromRouteName = (name: string | null): string => {
    if (!name) {
        return DEFAULT_ROUTE_COLOR;
    }
    const lowerCaseName = name.toLowerCase();
    // Find the first color keyword that exists in the name
    for (const colorWord in ROUTE_NAME_COLOR_MAP) {
        if (lowerCaseName.includes(colorWord)) {
            return ROUTE_NAME_COLOR_MAP[colorWord];
        }
    }
    // If no keyword found, return default grey
    return DEFAULT_ROUTE_COLOR;
};
// --- END NEW Color Logic ---


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Component ---
const BusScreen = () => {
  // --- State (Keep as is) ---
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());

  // --- Data Fetching & Callbacks (Keep as is) ---
  const fetchData = useCallback(async () => { console.log("Fetching bus data...");setError(null);try {const [routesResponse, stopsResponse, liveBusesResponse] = await Promise.all([fetch(`${API_BASE}/routes/`), fetch(`${API_BASE}/stops/`), fetch(`${API_BASE}/live/`),]);console.log("Fetch responses received:", routesResponse.status, stopsResponse.status, liveBusesResponse.status);if (!routesResponse.ok) throw new Error(`Routes fetch failed: ${routesResponse.status}`);if (!stopsResponse.ok) throw new Error(`Stops fetch failed: ${stopsResponse.status}`);if (!liveBusesResponse.ok) throw new Error(`Live Buses fetch failed: ${liveBusesResponse.status}`);const routesData = await routesResponse.json();const stopsData = await stopsResponse.json();const liveBusesData = await liveBusesResponse.json();const fetchedRoutes: BusRoute[] = routesData?.routes || [];const fetchedStops: BusStop[] = stopsData?.stops || [];const fetchedLiveBuses: LiveBus[] = liveBusesData?.buses || [];console.log(`Fetched ${fetchedRoutes.length} routes, ${fetchedStops.length} stops, ${fetchedLiveBuses.length} live buses.`);setRoutes(fetchedRoutes);setStops(fetchedStops);setLiveBuses(fetchedLiveBuses);} catch (err) { console.error('Error fetching bus data:', err);setError(err instanceof Error ? err.message : 'An unknown error occurred.');} finally {console.log("Fetching complete.");setLoading(false);setRefreshing(false);} }, []);
  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);
  const onRefresh = useCallback(() => { console.log("Refreshing data..."); setRefreshing(true); fetchData(); }, [fetchData]);
  const toggleExpand = useCallback((routeId: string) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpandedRoutes(prev => { const newSet = new Set(prev); if (newSet.has(routeId)) { newSet.delete(routeId); } else { newSet.add(routeId); } return newSet; }); }, []);
  const getStopsForRoute = useCallback((routeId: string): BusStop[] => { const filteredStops = stops.filter(stop => stop.routesAndPositions?.hasOwnProperty(routeId)); return filteredStops; }, [stops]);
  const getLiveBusesForRoute = useCallback((routeId: string): LiveBus[] => { return liveBuses.filter(bus => bus.routeId === routeId); }, [liveBuses]);
  const isBusAtStop = useCallback((bus: LiveBus, stop: BusStop): boolean => { const latDiff = bus.latitude - stop.latitude; const lonDiff = bus.longitude - stop.longitude; const distanceSquared = latDiff * latDiff + lonDiff * lonDiff; return distanceSquared < (PROXIMITY_THRESHOLD * PROXIMITY_THRESHOLD); }, []);

  // --- Render Function for List Items ---
  const renderRouteItem = ({ item: route }: { item: BusRoute }) => {
    const { id: routeId, name, shortName } = route;
    const isExpanded = expandedRoutes.has(routeId);
    const routeStops = getStopsForRoute(routeId);
    const routeLiveBuses = getLiveBusesForRoute(routeId); // Still fetch live buses for status icons

    // *** CHANGE: Use new function to get color from route name ***
    const routeColor = getColorFromRouteName(name);

    const busesAtAnyStopOnRoute = new Set<string>();
    routeStops.forEach(stop => { routeLiveBuses.forEach(bus => { if (isBusAtStop(bus, stop)) { busesAtAnyStopOnRoute.add(bus.id); } }); });
    const busesInTransit = routeLiveBuses.filter(bus => !busesAtAnyStopOnRoute.has(bus.id));

    // Determine color for bus icons (use routeColor, or maybe live bus color if preferred?)
    // Using routeColor for icons for consistency with header:
    const iconColor = routeColor;
    // Alternative: Use live bus color if available, otherwise route color
    // const iconColor = routeLiveBuses.length > 0 ? routeLiveBuses[0].color : routeColor;

    return (
      <View style={styles.routeCard}>
        <TouchableOpacity
          // Apply the name-derived color here
          style={[styles.routeHeader, { backgroundColor: routeColor }]}
          onPress={() => toggleExpand(routeId)}
          activeOpacity={0.7}
        >
          <Text style={styles.routeHeaderText} numberOfLines={1}>
            {shortName || name || `Route ${routeId}`}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#fff" // Keep text/icon color white
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.routeContent}>
            {/* Stops List */}
            {routeStops.length === 0 ? (
              loading ? <Text style={styles.noDataText}>Loading stops...</Text>
                      : <Text style={styles.noDataText}>No stops found</Text>
            ) : (
              routeStops.map((stop, index) => {
                const busesAtThisStop = routeLiveBuses.filter(bus => isBusAtStop(bus, stop));
                const isAnyBusAtThisStop = busesAtThisStop.length > 0;
                return (
                  <View key={stop.id} style={styles.stopRow}>
                    <Text style={styles.stopIndex}>{index + 1}.</Text>
                    <Ionicons
                      name={isAnyBusAtThisStop ? "bus-sharp" : "ellipse-outline"}
                      size={18}
                      // Use consistent iconColor derived earlier
                      color={isAnyBusAtThisStop ? iconColor : '#ccc'}
                      style={styles.busIcon}
                    />
                    <Text style={styles.stopName} numberOfLines={1}>{stop.name}</Text>
                    {isAnyBusAtThisStop && (<Text style={[styles.busStatus, { color: iconColor }]}>{' '}• At Stop</Text>)}
                  </View>
                );
              })
            )}

            {(routeStops.length > 0 && routeLiveBuses.length > 0) && (<View style={styles.separator} />)}

            {/* Live Bus Status Section */}
            {routeLiveBuses.length > 0 ? (
                <>
                    {busesInTransit.length > 0 && (
                        <View style={styles.inTransitSection}>
                            <Text style={styles.sectionTitle}>Buses In Transit:</Text>
                            {busesInTransit.map(bus => (
                                <View key={bus.id} style={styles.inTransitBusRow}>
                                    {/* Use consistent iconColor */}
                                    <Ionicons name="bus" size={16} color={iconColor} style={{marginRight: 8}} />
                                    <Text style={styles.inTransitBusText}>
                                         Bus {bus.name} (Speed: {bus.speed?.toFixed(0) ?? '0'} mph)
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                    {busesInTransit.length === 0 && routeStops.length > 0 && (
                        <Text style={styles.allBusesAtStopsText}>All active buses are currently at stops.</Text>
                    )}
                </>
            ) : (
                  !loading && routeStops.length > 0 && <Text style={styles.noDataText}>No active buses on this route</Text>
            )}
          </View>
        )}
      </View>
    );
  };


  // --- Main Render Logic (Keep as is) ---
  if (loading && routes.length === 0) { return ( <View style={styles.backgroundView}><StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} /><SafeAreaView style={[styles.safeAreaContent, styles.centered]}><ActivityIndicator size="large" color="#FFFFFF" /><Text style={styles.loadingText}>Loading Bus Data...</Text></SafeAreaView></View> ); }
  if (error && routes.length === 0) { return ( <View style={styles.backgroundView}><StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} /><SafeAreaView style={[styles.safeAreaContent, styles.centered, { paddingHorizontal: 30 }]}><Ionicons name="alert-circle-outline" size={60} color="#FFFFFF" style={{ marginBottom: 20 }}/><Text style={styles.errorTextLarge}>Failed to load bus data</Text><Text style={styles.errorTextSmall}>{error}</Text><TouchableOpacity onPress={() => { setLoading(true); fetchData(); }} style={styles.errorRetryButton}><Text style={styles.errorRetryButtonText}>Retry</Text></TouchableOpacity></SafeAreaView></View> ); }

  // Main Content Render
  return (
    <View style={styles.backgroundView}>
       <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
       <SafeAreaView style={styles.safeAreaContent}>
          <View style={styles.container}>
              <Text style={styles.header}>Bus Routes</Text>
              {error && !loading && ( <View style={styles.inlineError}><Ionicons name="warning-outline" size={16} color="#D32F2F" style={{marginRight: 5}}/><Text style={styles.inlineErrorText}>Refresh Error: {error}</Text></View> )}
              <FlatList
                data={routes}
                keyExtractor={(item) => item.id}
                renderItem={renderRouteItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={ !loading && !error ? <Text style={styles.emptyListText}>No bus routes available.</Text> : null }
                refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFFFFF', '#DDDDDD']} progressBackgroundColor="#5856d6" /> }
                initialNumToRender={8}
                maxToRenderPerBatch={5}
                windowSize={10}
              />
          </View>
       </SafeAreaView>
    </View>
  );
};

// --- Styles (Keep themed styles as is) ---
const styles = StyleSheet.create({
  backgroundView: { flex: 1, backgroundColor: '#483bcb', }, // Theme background color
  safeAreaContent: { flex: 1, }, // Handles padding for notches/bars
  container: { flex: 1, paddingHorizontal: 25, paddingBottom: 10, paddingTop: 15}, // Inner container for content layout
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', }, // For Loading/Error states
  header: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginTop: Platform.OS === 'ios' ? 10 : 30, marginBottom: 15, textAlign: 'center', }, // Themed header text
  listContainer: { paddingBottom: 30, }, // Padding at the end of the list
  routeCard: { marginBottom: 15, borderRadius: 12, backgroundColor: '#ffffff', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, }, // Card for each route
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 15, }, // Header part of the card
  routeHeaderText: { fontSize: 18, fontWeight: '600', color: '#333333', flex: 1, marginRight: 10, }, // Text within the header
  routeContent: { paddingTop: 10, paddingBottom: 15, paddingHorizontal: 15, }, // Content area when expanded
  stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', }, // Style for each stop row
  stopIndex: { fontSize: 14, width: 25, textAlign: 'right', color: '#666', marginRight: 10, }, // Stop number
  busIcon: { marginRight: 10, width: 20, textAlign: 'center', }, // Bus icon next to stop
  stopName: { fontSize: 15, color: '#333', flex: 1, }, // Stop name text
  busStatus: { fontSize: 13, fontWeight: '500', marginLeft: 5, }, // Text like "• At Stop"
  separator: { height: 1, backgroundColor: '#e5e5e5', marginVertical: 15, }, // Separator line
  inTransitSection: { marginTop: 5, }, // Section for buses not at stops
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#444', marginBottom: 8, }, // Title for "Buses In Transit"
   inTransitBusRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, }, // Row for a single in-transit bus
  inTransitBusText: { fontSize: 14, color: '#333', }, // Text describing the in-transit bus
  noDataText: { fontSize: 14, color: '#777', textAlign: 'center', paddingVertical: 20, fontStyle: 'italic', }, // Generic text for no stops/buses
   allBusesAtStopsText: { fontSize: 14, color: '#555', textAlign: 'center', paddingVertical: 15, fontStyle: 'italic', }, // Text when all buses are at stops
  emptyListText: { textAlign: 'center', color: '#FFFFFF', fontSize: 16, marginTop: 50, }, // Text when route list is empty
   loadingText: { marginTop: 16, color: '#FFFFFF', fontSize: 16, textAlign: 'center', }, // Loading text style
   errorTextLarge: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8, }, // Main error text style
   errorTextSmall: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, textAlign: 'center', marginBottom: 25, }, // Error detail text style
   errorRetryButton: { backgroundColor: 'rgba(255, 255, 255, 0.3)', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20, }, // Error retry button style
   errorRetryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', }, // Error retry button text style
   inlineError: { backgroundColor: '#FFCDD2', paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: 0, marginBottom: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', }, // Inline error banner style
  inlineErrorText: { color: '#D32F2F', fontSize: 13, flex: 1, }, // Inline error text style
});

export default BusScreen;