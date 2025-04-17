// NavigationScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import MapView, { Region, Polyline, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Coordinates, CustomRouteData } from '../types/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type NavigationScreenRouteProp = NativeStackNavigationProp<RootStackParamList, 'NavigationScreen'>;
type MapDirectionMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';

interface RouteParams {
  mode: string;
  startCoords: Coordinates;
  destinationCoords: Coordinates;
  travelTime: number;
  destination: string;
  startAddress: string;
  isCustomRoute?: boolean;
  customDirections?: string[];
  customPolyline?: Coordinates[];
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyBrsklzWqQijkHVivtGeYLUaXdXKVO6XIw';
const BRAND_PURPLE = '#483bcb';
const CUSTOM_POLYLINE_COLOR = '#8A2BE2'; // BlueViolet - stands out more
const GOOGLE_POLYLINE_COLOR = '#4A90E2';

const NavigationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationScreenRouteProp>();
  const {
    mode,
    startCoords: initialStartCoords,
    destinationCoords,
    travelTime: initialTravelTime,
    destination,
    startAddress: initialStartAddress,
    isCustomRoute = false,
    customDirections = [],
    customPolyline = [],
  } = route.params as RouteParams;

  const [startCoords, setStartCoords] = useState<Coordinates>(initialStartCoords);
  const [directionsSteps, setDirectionsSteps] = useState<any[]>([]);
  const [currentTravelTime, setCurrentTravelTime] = useState(initialTravelTime);
  const [loadingDirections, setLoadingDirections] = useState(!isCustomRoute);
  const [errorDirections, setErrorDirections] = useState<string | null>(null);
  const [currentCustomStepIndex, setCurrentCustomStepIndex] = useState(0);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let isMounted = true;
    const subscribeToLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { if (isMounted) Alert.alert('Error', 'Location permission not granted'); return; }
        subscription = await Location.watchPositionAsync( { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1500, distanceInterval: 3, }, (location) => { if (isMounted) { const newCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude, }; setStartCoords(newCoords); if(mapRef.current) { mapRef.current.animateCamera({ center: newCoords, zoom: 17 }, { duration: 1000 }); } } } );
      } catch (error) { console.error('Location watch error:', error); if (isMounted) Alert.alert('Location Error', 'Could not track location.'); }
    };
    subscribeToLocation();
    return () => { isMounted = false; subscription && subscription.remove(); };
  }, []);

  const fetchDirections = useCallback(async () => {
    if (isCustomRoute || !startCoords || !destinationCoords) return;
    setLoadingDirections(true); setErrorDirections(null);
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startCoords.latitude},${startCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=${mode.toLowerCase()}&key=${GOOGLE_MAPS_API_KEY}`);
      if (!response.ok) { const errorData = await response.text(); throw new Error(`Failed to fetch directions (${response.status}) ${errorData}`); };
      const data = await response.json();
      if (data.routes?.[0]?.legs?.[0]?.steps && data.routes[0].legs[0].duration?.value !== undefined) { setDirectionsSteps(data.routes[0].legs[0].steps); const updatedTimeSec = data.routes[0].legs[0].duration.value; setCurrentTravelTime(Math.round(updatedTimeSec / 60)); }
      else { setDirectionsSteps([]); setErrorDirections("Could not find directions for this route/mode."); }
    } catch (error: any) { console.error('Live directions fetch error:', error); setErrorDirections(error.message || "Failed to fetch directions."); }
    finally { setLoadingDirections(false); }
  }, [startCoords, destinationCoords, mode, isCustomRoute]);

  useEffect(() => {
    if (isCustomRoute) return;
    fetchDirections();
    const intervalId = setInterval(fetchDirections, 10000);
    return () => clearInterval(intervalId);
  }, [fetchDirections, isCustomRoute]);

  const calculateETA = () => { if (currentTravelTime < 0 || currentTravelTime === undefined) return "--:--"; const now = new Date(); now.setMinutes(now.getMinutes() + currentTravelTime); return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  const centerMapOnUser = useCallback(() => { if (mapRef.current && startCoords) { mapRef.current.animateCamera({ center: startCoords, zoom: 17 }, { duration: 1000 }); } }, [startCoords]);

  useEffect(() => { if (startCoords && mapRef.current) { const timer = setTimeout(centerMapOnUser, 1500); return () => clearTimeout(timer); } }, [startCoords, centerMapOnUser]);

  const handleNextCustomStep = () => { setCurrentCustomStepIndex(prev => Math.min(prev + 1, customDirections.length - 1)); };
  const handlePreviousCustomStep = () => { setCurrentCustomStepIndex(prev => Math.max(prev - 1, 0)); };

  const currentInstruction = isCustomRoute ? (customDirections[currentCustomStepIndex] || 'Start Custom Route') : directionsSteps[0]?.html_instructions ? directionsSteps[0].html_instructions.replace(/<[^>]+>/g, '') : loadingDirections ? 'Calculating route...' : (errorDirections || 'Route calculated.');
  const nextInstruction = isCustomRoute ? (customDirections[currentCustomStepIndex + 1] ? `Next: ${customDirections[currentCustomStepIndex + 1]}` : 'You have arrived') : directionsSteps[1]?.html_instructions ? `Next: ${directionsSteps[1].html_instructions.replace(/<[^>]+>/g, '')}` : '';

  return (
    <View style={styles.backgroundView}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        <MapView
            ref={mapRef}
            style={styles.map}
            provider="google"
            showsUserLocation={true}
            followsUserLocation={false}
            showsMyLocationButton={false}
            initialRegion={startCoords ? { latitude: startCoords.latitude, longitude: startCoords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.005, } : undefined}
            mapPadding={{ top: 80, bottom: 150 }}
        >
            {startCoords && destinationCoords && (
                isCustomRoute && customPolyline.length > 0 ? (
                    <Polyline coordinates={customPolyline} strokeColor={CUSTOM_POLYLINE_COLOR} strokeWidth={6} zIndex={1}/>
                ) : !isCustomRoute ? (
                     <MapViewDirections origin={startCoords} destination={destinationCoords} apikey={GOOGLE_MAPS_API_KEY} mode={mode.toUpperCase() as MapDirectionMode} strokeWidth={5} strokeColor={GOOGLE_POLYLINE_COLOR} zIndex={1} onReady={(result) => { if (mapRef.current && result.coordinates) { mapRef.current.fitToCoordinates(result.coordinates, { edgePadding: { top: 120, right: 50, bottom: 180, left: 50 }, animated: true }); } }} onError={(errorMessage) => { console.error('MapViewDirections Error:', errorMessage); Alert.alert('Route Error', `Could not display ${mode} route.`); setErrorDirections(`Could not display ${mode} route.`); }} />
                ) : null
            )}
            {destinationCoords && <Marker coordinate={destinationCoords} title={destination} pinColor="green" />}
        </MapView>

        <TouchableOpacity style={styles.floatingCenterButton} onPress={centerMapOnUser}>
            <Ionicons name="locate-outline" size={24} color={BRAND_PURPLE} />
        </TouchableOpacity>

        <SafeAreaView style={styles.topInfoContainerWrapper} edges={['top']}>
            <View style={styles.topInfoBarContent}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="close-outline" size={30} color="#333" />
                </TouchableOpacity>
                <View style={styles.etaContainer}>
                    <Text style={styles.etaTime}>{currentTravelTime >= 0 ? `${currentTravelTime} min` : '--'}</Text>
                    <Text style={styles.etaLabel}>ETA: {calculateETA()}</Text>
                </View>
                 <View style={{width: 44}} />
            </View>
        </SafeAreaView>

        <SafeAreaView style={styles.bottomCardWrapper} edges={['bottom']}>
            {/* --- Apply background color directly to the content view --- */}
            <View style={styles.bottomDirectionsCardContent}>
              {isCustomRoute ? (
                  <>
                      <Text style={styles.currentStepText} numberOfLines={3}>{currentCustomStepIndex + 1}. {currentInstruction}</Text>
                       <Text style={styles.nextStepText} numberOfLines={2}>{nextInstruction}</Text>
                      <View style={styles.customNavButtonContainer}>
                          <TouchableOpacity style={[styles.customNavButton, currentCustomStepIndex === 0 && styles.customNavButtonDisabled]} onPress={handlePreviousCustomStep} disabled={currentCustomStepIndex === 0}>
                              <Ionicons name="chevron-back-outline" size={28} color={currentCustomStepIndex === 0 ? 'rgba(255,255,255,0.4)' : '#FFFFFF'} />
                              <Text style={[styles.customNavButtonText, currentCustomStepIndex === 0 && styles.customNavButtonTextDisabled]}>Prev</Text>
                          </TouchableOpacity>
                           <TouchableOpacity style={[styles.customNavButton, currentCustomStepIndex === customDirections.length - 1 && styles.customNavButtonDisabled]} onPress={handleNextCustomStep} disabled={currentCustomStepIndex === customDirections.length - 1}>
                               <Text style={[styles.customNavButtonText, currentCustomStepIndex === customDirections.length - 1 && styles.customNavButtonTextDisabled]}>Next</Text>
                               <Ionicons name="chevron-forward-outline" size={28} color={currentCustomStepIndex === customDirections.length - 1 ? 'rgba(255,255,255,0.4)' : '#FFFFFF'} />
                           </TouchableOpacity>
                      </View>
                  </>
              ) : (
                  <>
                    {loadingDirections && <ActivityIndicator size="small" color={"#FFFFFF"} style={styles.loadingIndicator} />}
                    {!loadingDirections && errorDirections && <Text style={styles.errorText} numberOfLines={2}>{errorDirections}</Text>}
                    {!loadingDirections && !errorDirections && directionsSteps.length > 0 &&
                        <>
                            <Text style={styles.currentStepText} numberOfLines={2}>{currentInstruction}</Text>
                            <Text style={styles.nextStepText} numberOfLines={1}>{nextInstruction}</Text>
                        </>
                    }
                     {!loadingDirections && !errorDirections && directionsSteps.length === 0 &&
                        <Text style={styles.errorText}>No direction steps available.</Text>
                     }
                  </>
              )}
          </View>
        </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
    backgroundView: { flex: 1 },
    map: { flex: 1 },
    floatingCenterButton: { position: 'absolute', bottom: 180, right: 15, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 30, width: 50, height: 50, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, zIndex: 5, },
    topInfoContainerWrapper: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, },
    topInfoBarContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 8, paddingTop: Platform.OS === 'ios' ? 8 : 12, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, },
    backButton: { padding: 8, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    etaContainer: { alignItems: 'center', paddingHorizontal: 15, paddingVertical: 5, },
    etaTime: { color: '#333', fontSize: 20, fontWeight: 'bold', },
    etaLabel: { color: '#555', fontSize: 13, fontWeight: '500', },
    bottomCardWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, },
    bottomDirectionsCardContent: {
        backgroundColor: BRAND_PURPLE, // --- Apply brand color ---
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 25,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: 140,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        justifyContent: 'space-between',
    },
    loadingIndicator: { marginVertical: 20 },
    currentStepText: {
        fontSize: 18,
        color: '#FFFFFF', // --- White text ---
        fontWeight: '600',
        marginBottom: 5, // Reduced margin
        lineHeight: 26,
        textAlign: 'center',
        minHeight: 52
     },
    nextStepText: {
        fontSize: 14, // Slightly smaller
        color: 'rgba(255, 255, 255, 0.8)', // --- Lighter white text ---
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 15
     },
    errorText: {
        fontSize: 16,
        color: '#FFCDD2', // --- Light red on purple ---
        textAlign: 'center',
        fontWeight: '500',
        marginVertical: 20
    },
    customNavButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10, // Reduced space above buttons
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)', // --- Lighter separator ---
        paddingTop: 10,
    },
    customNavButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    customNavButtonDisabled: {
        opacity: 0.4,
    },
    customNavButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#FFFFFF', // --- White text ---
        marginHorizontal: 5,
    },
    customNavButtonTextDisabled: {
        color: 'rgba(255, 255, 255, 0.4)', // --- Dimmed white text ---
    }
});

export default NavigationScreen;