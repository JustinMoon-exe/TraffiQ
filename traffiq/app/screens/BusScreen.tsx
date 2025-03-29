// BusRouteListScreen.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types for our API responses
interface BusRoute {
  id: string;
  myid: string;
  name: string;
  shortName: string | null;
  color?: string;
}

interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routesAndPositions: { [routeId: string]: number[] };
}

interface LiveBus {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  speed: number;
  routeId: string;
  routeName: string;
  color: string;
}

const API_BASE = 'http://10.0.2.2:8000/api/bus';
const desiredColors = ['purple', 'blue', 'green', 'red'];

const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const BusScreen = () => {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const routesResponse = await fetch(`${API_BASE}/routes/`);
        const routesData = await routesResponse.json();
        let fetchedRoutes: BusRoute[] = routesData.routes || [];
        setRoutes(fetchedRoutes);

        const stopsResponse = await fetch(`${API_BASE}/stops/`);
        const stopsData = await stopsResponse.json();
        const fetchedStops: BusStop[] = stopsData.stops || [];
        setStops(fetchedStops);

        const liveBusesResponse = await fetch(`${API_BASE}/live/`);
        const liveBusesData = await liveBusesResponse.json();
        const fetchedLiveBuses: LiveBus[] = liveBusesData.buses || [];
        setLiveBuses(fetchedLiveBuses);

      } catch (error) {
        console.error('Error fetching bus data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleExpand = (routeId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRoutes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  };

  const getStopsForRoute = (routeId: string): BusStop[] => {
    return stops.filter(stop => {
      if (!stop.routesAndPositions) {
        return false;
      }
      for (const stopRouteId in stop.routesAndPositions) {
        if (stop.routesAndPositions.hasOwnProperty(stopRouteId)) {
          if (stopRouteId === routeId) {
            return true;
          }
        }
      }
      return false;
    });
  };

    const getLiveBusesForRoute = (routeId: string): LiveBus[] => {
      return liveBuses.filter(
        bus => bus.routeId === routeId
      );
    };

    const isBusAtStop = (bus: LiveBus, stop: BusStop): boolean => {
        const distance = Math.sqrt(
            Math.pow(bus.latitude - stop.latitude, 2) + Math.pow(bus.longitude - stop.longitude, 2)
        );
        return distance < 0.0005;
    };


  const renderRouteItem = ({ item, index }: { item: BusRoute; index: number }) => {
    const key = `${item.id}-${index}`;
    const isExpanded = expandedRoutes.has(item.myid);
    const routeColor = item.color ? item.color : stringToColor(item.myid);
    const routeStops = getStopsForRoute(item.myid);
    const routeLiveBuses = getLiveBusesForRoute(item.myid);

    return (
      <View key={key} style={styles.routeContainer}>
        <TouchableOpacity
          style={[styles.routeHeader, { backgroundColor: routeColor }]}
          onPress={() => toggleExpand(item.myid)}
        >
          <Text style={styles.routeHeaderText}>
            {item.shortName || item.name}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.routeContent}>
            { !routeStops || routeStops.length === 0 ? ( // <----  ADDITION HERE: Check if routeStops is truthy and then length
              <Text style={styles.routeContentText}>No stops available</Text>
            ) : (
              routeStops.map((stop, idx) => {
                const busesAtStop = routeLiveBuses.filter(bus => isBusAtStop(bus, stop));
                const busesBetweenStops = routeLiveBuses.filter(bus => !isBusAtStop(bus, stop));

                return (
                  <View key={`${stop.id}-${idx}`} style={styles.stopRow}>
                    <Text style={styles.stopIndex}>{idx + 1}.</Text>
                    {busesAtStop.length > 0 ? (
                        <Ionicons name="bus-sharp" size={16} color={routeColor} style={styles.busIcon} />
                    ) : (
                        <Ionicons name="bus-outline" size={16} color={routeColor} style={styles.busIcon} />
                    )}
                    <Text style={styles.stopName}>{stop.name}</Text>
                    {busesAtStop.length > 0 && (
                        <Text style={styles.busStatus}> - At Stop</Text>
                    )}
                    {busesBetweenStops.length > 0 && !busesAtStop.length && routeLiveBuses.some(bus => !isBusAtStop(bus, stop)) && (
                        routeLiveBuses.map((bus, busIdx) => {
                            if (!isBusAtStop(bus, stop)) {
                                return (
                                    <Text key={`${bus.id}-${busIdx}`} style={styles.busStatus}> - Bus {bus.name} In Transit</Text>
                                );
                            }
                            return null;
                        })
                    )}
                  </View>
                );
              })
            )}
             {routeLiveBuses.length > 0 && routeStops && routeStops.length > 0 && routeLiveBuses.every(bus => routeStops.every(stop => !isBusAtStop(bus, stop))) && ( // <----  ADDITION HERE: Check if routeStops is truthy
                <View style={styles.noStopBuses}>
                    {routeLiveBuses.map((bus, busIdx) => (
                        <Text key={`${bus.id}-${busIdx}`} style={styles.busStatus}>Bus {bus.name} - In Transit (Between Stops)</Text>
                    ))}
                </View>
            )}
             {routeLiveBuses.length === 0 && isExpanded && routeStops && routeStops.length > 0 && ( // <----  ADDITION HERE: Check if routeStops is truthy
                <Text style={styles.noBusesText}>No active buses on this route right now.</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={routes}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderRouteItem}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  listContainer: { paddingBottom: 20 },
  routeContainer: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  routeHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  routeContent: {
    backgroundColor: '#f9f9f9',
    padding: 10,
  },
  routeContentText: {
    fontSize: 14,
    color: '#333',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  stopIndex: {
    fontSize: 14,
    width: 25,
    textAlign: 'center',
    color: '#333',
  },
  busIcon: {
    marginHorizontal: 5,
  },
  stopName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  busStatus: {
      fontSize: 14,
      color: 'grey',
  },
  noBusesText: {
      fontSize: 14,
      color: 'grey',
      textAlign: 'center',
      marginTop: 10,
  },
  noStopBuses: {
      paddingVertical: 5,
      paddingHorizontal: 10,
  }
});

export default BusScreen;