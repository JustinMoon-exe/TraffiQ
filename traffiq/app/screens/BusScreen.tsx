// BusScreen.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Removed useMemo
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

// --- Interfaces (Simple id:myid version) ---
interface BusRoute { id: string; name: string; shortName: string | null; polyline: any[]; }
interface BusStop { id: string; name: string; latitude: number; longitude: number; routesAndPositions: { [routeId: string]: number[] }; }
interface LiveBus { id: string; name: string; latitude: number; longitude: number; speed: number; routeId: string | null; routeName: string; color: string; }

const API_BASE = 'http://10.0.2.2:8000/api/bus';
const LATITUDE_PROXIMITY_THRESHOLD = 0.0015; // Keep adjusted threshold
const LATITUDE_PROXIMITY_THRESHOLD_SQUARED = LATITUDE_PROXIMITY_THRESHOLD * LATITUDE_PROXIMITY_THRESHOLD;

const ROUTE_NAME_COLOR_MAP: { [key: string]: string } = { green: '#caffca', blue: '#2196F3', red: '#f5a5a5', purple: '#9b99ff', orange: '#FF9800', yellow: '#FFC107', pink: '#E91E63', silver: '#BDBDBD', gold: '#FFD700', brown: '#795548', black: '#212121', };
const DEFAULT_ROUTE_COLOR = '#9E9E9E';
const getColorFromRouteName = (name: string | null): string => { if (!name) { return DEFAULT_ROUTE_COLOR; } const lowerCaseName = name.toLowerCase(); for (const colorWord in ROUTE_NAME_COLOR_MAP) { if (lowerCaseName.includes(colorWord)) { return ROUTE_NAME_COLOR_MAP[colorWord]; } } return DEFAULT_ROUTE_COLOR; };

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) { UIManager.setLayoutAnimationEnabledExperimental(true); }

const BusScreen = () => {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => { /* ... (keep as is) ... */ console.log("Fetching bus data...");setError(null);try {const [routesResponse, stopsResponse, liveBusesResponse] = await Promise.all([fetch(`${API_BASE}/routes/`), fetch(`${API_BASE}/stops/`), fetch(`${API_BASE}/live/`),]);if (!routesResponse.ok) throw new Error(`Routes fetch failed: ${routesResponse.status}`);if (!stopsResponse.ok) throw new Error(`Stops fetch failed: ${stopsResponse.status}`);if (!liveBusesResponse.ok) throw new Error(`Live Buses fetch failed: ${liveBusesResponse.status}`);const routesData = await routesResponse.json();const stopsData = await stopsResponse.json();const liveBusesData = await liveBusesResponse.json();const fetchedRoutes: BusRoute[] = routesData?.routes || [];const fetchedStops: BusStop[] = stopsData?.stops || [];const fetchedLiveBuses: LiveBus[] = liveBusesData?.buses || [];setRoutes(fetchedRoutes);setStops(fetchedStops);setLiveBuses(fetchedLiveBuses);} catch (err) { console.error('Error fetching bus data:', err);setError(err instanceof Error ? err.message : 'An unknown error occurred.');} finally {console.log("Fetching complete.");setLoading(false);setRefreshing(false);} }, []);
  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);
  const toggleExpand = useCallback((routeId: string) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpandedRoutes(prev => { const newSet = new Set(prev); if (newSet.has(routeId)) { newSet.delete(routeId); } else { newSet.add(routeId); } return newSet; }); }, []);

  // --- Keep helpers using useCallback at top level ---
  const getStopsForRoute = useCallback((routeId: string | undefined): BusStop[] => { if (!routeId) { return []; } const filteredStops = stops.filter(stop => stop.routesAndPositions?.hasOwnProperty(routeId)); return filteredStops; }, [stops]);
  const getLiveBusesForRoute = useCallback((routeId: string | undefined): LiveBus[] => { if (!routeId) { return []; } const filteredBuses = liveBuses.filter(bus => bus.routeId === routeId); return filteredBuses; }, [liveBuses]);

  // --- Keep isBusAtStop using useCallback at top level ---
  const isBusAtStop = useCallback((bus: LiveBus, stop: BusStop): boolean => {
    if (bus.latitude === null || !stop?.latitude) { return false; }
    const latDiff = bus.latitude - stop.latitude;
    const latDistanceSquared = latDiff * latDiff; // Latitude-only check
    const result = latDistanceSquared < LATITUDE_PROXIMITY_THRESHOLD_SQUARED;
    // console.log(`LAT ONLY CHECK: Bus ${bus.name} (${bus.latitude.toFixed(6)}) vs Stop ${stop.name} (${stop.latitude.toFixed(6)}) -> LatDistSq: ${latDistanceSquared.toFixed(10)}, ThresholdSq: ${LATITUDE_PROXIMITY_THRESHOLD_SQUARED.toFixed(10)}, AtStop: ${result}`);
    return result;
  }, []); // Dependency array empty if threshold is constant


  // --- MODIFIED renderRouteItem - Calculation done inside ---
  const renderRouteItem = ({ item: route }: { item: BusRoute }) => {
    const { id: routeId, name, shortName } = route;
    const isExpanded = expandedRoutes.has(routeId);
    const routeColor = getColorFromRouteName(name);
    const iconColor = routeColor;

    // *** Get data needed for this item ***
    const routeStops = getStopsForRoute(routeId);
    const routeLiveBuses = getLiveBusesForRoute(routeId);

    // *** Calculate bus-stop grouping *inside* renderRouteItem (no useMemo here) ***
    const busesGroupedByStop = new Map<string, LiveBus[]>();
    if (isExpanded) { // Only calculate if expanded
        // console.log(`Calculating bus positions for route ${routeId}`);
        routeLiveBuses.forEach(bus => {
            if (bus.latitude === null) return;
            let closestStopId: string | null = null;
            let minDistanceSq = Infinity;
            routeStops.forEach(stop => {
                if (!stop.latitude) return;
                const latDiff = bus.latitude - stop.latitude;
                const distanceSq = latDiff * latDiff;
                if (distanceSq < LATITUDE_PROXIMITY_THRESHOLD_SQUARED && distanceSq < minDistanceSq) {
                    minDistanceSq = distanceSq;
                    closestStopId = stop.id;
                }
            });
            if (closestStopId !== null) {
                // console.log(` -> Assigning Bus ${bus.name} to Stop ID ${closestStopId}`);
                const existingBuses = busesGroupedByStop.get(closestStopId) || [];
                busesGroupedByStop.set(closestStopId, [...existingBuses, bus]);
            }
        });
    }
    // *** End calculation ***

    return (
      <View style={styles.routeCard}>
        <TouchableOpacity style={[styles.routeHeader, { backgroundColor: routeColor }]} onPress={() => toggleExpand(routeId)} activeOpacity={0.7}>
          <Text style={styles.routeHeaderText} numberOfLines={1}>{shortName || name || `Route ${routeId}`}</Text>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color="#333333"/>
        </TouchableOpacity>

        {/* Render logic uses the calculated busesGroupedByStop */}
        {isExpanded && (
          <View style={styles.routeContent}>
            {routeStops.length === 0 ? (
              loading ? <Text style={styles.noDataText}>Loading stops...</Text>
                      : <Text style={styles.noDataText}>No stops found</Text>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Route Stops:</Text>
                {routeStops.map((stop, index) => {
                  // Get buses for this stop from the pre-calculated map
                  const busesSpecificallyAtThisStop = busesGroupedByStop.get(stop.id) || [];
                  const isAnyBusAtThisStop = busesSpecificallyAtThisStop.length > 0;

                  return (
                    <View key={stop.id} style={styles.stopContainer}>
                      <View style={styles.stopRow}>
                        <Text style={styles.stopIndex}>{index + 1}.</Text>
                        <Ionicons name={isAnyBusAtThisStop ? "bus-sharp" : "ellipse-outline"} size={18} color={isAnyBusAtThisStop ? iconColor : '#ccc'} style={styles.busIcon} />
                        <Text style={styles.stopName} numberOfLines={1}>{stop.name}</Text>
                      </View>
                      {isAnyBusAtThisStop && (
                        <View style={styles.busesAtStopSection}>
                          {busesSpecificallyAtThisStop.map(bus => (
                            <View key={bus.id} style={styles.busAtStopRow}>
                              <Ionicons name="information-circle-outline" size={14} color={iconColor} style={styles.busAtStopIcon}/>
                              <Text style={styles.busAtStopText}> Bus {bus.name} currently near stop </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}
            {routeLiveBuses.length === 0 && routeStops.length > 0 && !loading && ( <Text style={styles.noDataText}>No active buses on this route currently.</Text> )}
          </View>
        )}
      </View>
    );
  }; // End renderRouteItem

  // --- Loading/Error/Main Return (Keep as is) ---
  if (loading && routes.length === 0) { return ( <View style={styles.backgroundView}><StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} /><SafeAreaView style={[styles.safeAreaContent, styles.centered]}><ActivityIndicator size="large" color="#FFFFFF" /><Text style={styles.loadingText}>Loading Bus Data...</Text></SafeAreaView></View> ); }
  if (error && routes.length === 0) { return ( <View style={styles.backgroundView}><StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} /><SafeAreaView style={[styles.safeAreaContent, styles.centered, { paddingHorizontal: 30 }]}><Ionicons name="alert-circle-outline" size={60} color="#FFFFFF" style={{ marginBottom: 20 }}/><Text style={styles.errorTextLarge}>Failed to load bus data</Text><Text style={styles.errorTextSmall}>{error}</Text><TouchableOpacity onPress={() => { setLoading(true); fetchData(); }} style={styles.errorRetryButton}><Text style={styles.errorRetryButtonText}>Retry</Text></TouchableOpacity></SafeAreaView></View> ); }

  return (
    <View style={styles.backgroundView}>
       <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
       <SafeAreaView style={styles.safeAreaContent}>
          <View style={styles.container}>
              <Text style={styles.header}>Bus Routes</Text>
              {error && !loading && ( <View style={styles.inlineError}><Ionicons name="warning-outline" size={16} color="#D32F2F" style={{marginRight: 5}}/><Text style={styles.inlineErrorText}>Refresh Error: {error}</Text></View> )}
              <FlatList
                data={routes}
                keyExtractor={(item) => item.id} // Use myid for list key
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
    backgroundView: { flex: 1, backgroundColor: '#483bcb', },
    safeAreaContent: { flex: 1, },
    container: { flex: 1, paddingHorizontal: 15, paddingBottom: 10, paddingTop: Platform.OS === 'ios' ? 0 : 15 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', },
    header: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginTop: Platform.OS === 'ios' ? 10 : 30, marginBottom: 15, textAlign: 'center', },
    listContainer: { paddingBottom: 30, },
    routeCard: { marginBottom: 15, borderRadius: 12, backgroundColor: '#ffffff', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, },
    routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 15, },
    routeHeaderText: { fontSize: 18, fontWeight: '600', color: '#333333', flex: 1, marginRight: 10, },
    routeContent: { paddingTop: 10, paddingBottom: 15, paddingHorizontal: 15, },
    stopContainer: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10, marginBottom: 10, },
    stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, },
    stopIndex: { fontSize: 14, width: 25, textAlign: 'right', color: '#666', marginRight: 10, },
    busIcon: { marginRight: 10, width: 20, textAlign: 'center', },
    stopName: { fontSize: 15, color: '#333', flex: 1, marginRight: 5 },
    busesAtStopSection: { marginTop: 5, marginLeft: 55, paddingLeft: 5, },
    busAtStopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, },
    busAtStopIcon: { marginRight: 6, },
    busAtStopText: { fontSize: 13, color: '#555', fontStyle: 'italic', },
    separator: { height: 1, backgroundColor: '#e5e5e5', marginVertical: 15, },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: '#444', marginBottom: 8, },
    noDataText: { fontSize: 14, color: '#777', textAlign: 'center', paddingVertical: 20, fontStyle: 'italic', },
    emptyListText: { textAlign: 'center', color: '#FFFFFF', fontSize: 16, marginTop: 50, },
    loadingText: { marginTop: 16, color: '#FFFFFF', fontSize: 16, textAlign: 'center', },
    errorTextLarge: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8, },
    errorTextSmall: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, textAlign: 'center', marginBottom: 25, },
    errorRetryButton: { backgroundColor: 'rgba(255, 255, 255, 0.3)', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20, },
    errorRetryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', },
    inlineError: { backgroundColor: '#FFCDD2', paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: 0, marginBottom: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', },
    inlineErrorText: { color: '#D32F2F', fontSize: 13, flex: 1, },
});

export default BusScreen;