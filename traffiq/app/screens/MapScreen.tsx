// MapScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList, Coordinates } from '../types';
import { db, auth } from '../firebaseConfig';
import { doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

type MapScreenRouteProp = RouteProp<RootStackParamList, 'MapScreen'>;
type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MapScreen'>;

const TRANSPORT_MODES: Array<"DRIVING" | "WALKING" | "TRANSIT"> = ["DRIVING", "WALKING", "TRANSIT"];
const API_KEY = "AIzaSyBrsklzWqQijkHVivtGeYLUaXdXKVO6XIw";

const getModeIcon = (mode: "DRIVING" | "WALKING" | "TRANSIT"): keyof typeof Ionicons.glyphMap => {
    switch (mode) {
        case "DRIVING": return "car-sport-outline";
        case "WALKING": return "walk-outline";
        case "TRANSIT": return "bus-outline";
        default: return "help-circle-outline";
    }
}

const MapScreen = () => {
  const route = useRoute<MapScreenRouteProp>();
  const navigation = useNavigation<MapScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);

  const [startAddress, setStartAddress] = useState('');
  const [startCoords, setStartCoords] = useState<Coordinates | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<"DRIVING" | "WALKING" | "TRANSIT">("DRIVING");
  const [travelTimes, setTravelTimes] = useState<{ [key in "DRIVING" | "WALKING" | "TRANSIT"]?: number }>({});

  const initialDestination = route.params?.destination || '';

   const fitMapToCoordinates = useCallback(() => {
    if (mapRef.current && startCoords && destinationCoords) { mapRef.current.fitToCoordinates([startCoords, destinationCoords], { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true, }); }
    else if (mapRef.current && startCoords) { mapRef.current.animateToRegion({ latitude: startCoords.latitude, longitude: startCoords.longitude, latitudeDelta: 0.02, longitudeDelta: 0.01, }, 1000); }
   }, [startCoords, destinationCoords]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null; let isMounted = true; const startWatching = async () => { try { const { status } = await Location.requestForegroundPermissionsAsync(); if (status !== 'granted') { if (isMounted) { setError('Location permission needed'); setLoading(false); } return; } const initialLocation = await Location.getLastKnownPositionAsync(); let initialCoords: Coordinates | null = null; if (initialLocation) { initialCoords = { latitude: initialLocation.coords.latitude, longitude: initialLocation.coords.longitude }; } else { const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }); initialCoords = { latitude: currentLoc.coords.latitude, longitude: currentLoc.coords.longitude }; } if (initialCoords && isMounted) { setStartCoords(initialCoords); try { const reverse = await Location.reverseGeocodeAsync(initialCoords); if (isMounted) { setStartAddress(reverse[0]?.name || reverse[0]?.street || 'My Location'); } } catch (geocodeError) { console.error("Reverse geocode error:", geocodeError); if (isMounted) setStartAddress('My Location'); } } subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10, }, (location) => { if (isMounted) { const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude }; setStartCoords(coords); } }); } catch (err) { console.error("Location setup error:", err); if (isMounted) { setError("Failed to get location"); setLoading(false); } } }; startWatching(); return () => { isMounted = false; if (subscription) { subscription.remove(); } };
  }, []);
  useEffect(() => {
     let isMounted = true; const fetchDestination = async () => { if (!initialDestination) { if(isMounted) { setLoading(false); } return; } try { const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(initialDestination)}&key=${API_KEY}`); const data = await response.json(); if (data.status === "OK" && data.results?.[0]?.geometry?.location) { const { lat, lng } = data.results[0].geometry.location; if(isMounted) { setDestinationCoords({ latitude: lat, longitude: lng }); setError(null); } } else { throw new Error(data.error_message || `Could not find location (${data.status})`); } } catch (err: any) { if(isMounted){ setError(`Error finding destination: ${err.message}`); Alert.alert('Error', `Could not find location: ${initialDestination}`); setLoading(false); } } }; fetchDestination(); return () => { isMounted = false; };
  }, [initialDestination]);
  useEffect(() => {
     if(error) { setLoading(false); } else if (startCoords && destinationCoords) { setLoading(false); } else if (!initialDestination && startCoords) { setLoading(false); } else { setLoading(true); }
   }, [startCoords, destinationCoords, initialDestination, error]);
   useEffect(() => {
     let isMounted = true; const fetchTravelTimeForMode = async (mode: "DRIVING" | "WALKING" | "TRANSIT") => { if (!startCoords || !destinationCoords) return undefined; try { const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startCoords.latitude},${startCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=${mode.toLowerCase()}&key=${API_KEY}`); const data = await response.json(); if(data.status === "OK") { const duration = data.routes?.[0]?.legs?.[0]?.duration?.value; return duration; } else { console.warn(`[MapScreen] Directions status for ${mode}: ${data.status}`); return undefined; } } catch (err) { console.error(`Travel time error for ${mode}:`, err); return undefined; } }; const fetchAllTravelTimes = async () => { if (!startCoords || !destinationCoords || !isMounted) return; console.log("[MapScreen] Fetching all travel times..."); setTravelTimes({}); const times: { [key in "DRIVING" | "WALKING" | "TRANSIT"]?: number } = {}; const results = await Promise.all(TRANSPORT_MODES.map(mode => fetchTravelTimeForMode(mode))); if(!isMounted) return; TRANSPORT_MODES.forEach((mode, index) => { const t = results[index]; if (t !== undefined) { times[mode] = t; } else { console.log(`No route found for mode: ${mode}`); } }); console.log("[MapScreen] Fetched Times:", times); if(isMounted) setTravelTimes(times); }; if(startCoords && destinationCoords){ fetchAllTravelTimes(); } return () => { isMounted = false; };
  }, [startCoords, destinationCoords]);
  useEffect(() => {
     if(startCoords && destinationCoords && mapRef.current) { const timer = setTimeout(fitMapToCoordinates, 600); return () => clearTimeout(timer); } else if (startCoords && mapRef.current) { const timer = setTimeout(fitMapToCoordinates, 600); return () => clearTimeout(timer); }
  }, [startCoords, destinationCoords, fitMapToCoordinates]);

  const handleStartNavigation = () => {
    if (!startCoords || !destinationCoords) { Alert.alert('Error', 'Start or destination coordinates are missing.'); return; } const selectedTravelTime = travelTimes[selectedMode]; if (selectedTravelTime === undefined) { Alert.alert('Error', 'Travel time not available for selected mode.'); return; } navigation.navigate('NavigationScreen', { mode: selectedMode, startCoords, destinationCoords, travelTime: Math.round(selectedTravelTime / 60), destination: initialDestination, startAddress: startAddress || "Current Location", });
  };
  const handleSaveRoute = async () => {
     if (!startCoords || !destinationCoords) { Alert.alert("Error", "Route coordinates missing."); return; } if (!auth.currentUser) { Alert.alert("Login Required", "You must be logged in to save routes."); return; } const selectedTravelTime = travelTimes[selectedMode]; if (selectedTravelTime === undefined) { Alert.alert("Error", "Travel time is not available for the selected mode."); return; } const newRoute = { startAddress: "Current Location", destination: initialDestination, startCoords, destinationCoords, mode: selectedMode, travelTime: Math.round(selectedTravelTime / 60), timestamp: new Date().toISOString(), }; try { const userDocRef = doc(db, "users", auth.currentUser.uid); await setDoc(userDocRef, { savedRoutes: arrayUnion(newRoute) }, { merge: true }); Alert.alert('Success', 'Route saved!'); } catch (error) { console.error("Save route error:", error); Alert.alert('Error', 'Failed to save route. Please try again.'); }
  };
  const handleGoBack = () => {
      navigation.goBack();
  }

  if (loading) { return ( <View style={styles.backgroundView}><StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} /><SafeAreaView style={[styles.safeAreaContent, styles.centered]}><ActivityIndicator size="large" color="#FFFFFF" /><Text style={styles.loadingText}>Finding location...</Text></SafeAreaView></View> ); }
  if (error) { return ( <View style={styles.backgroundView}><StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} /><SafeAreaView style={[styles.safeAreaContent, styles.centered]}><Ionicons name="alert-circle-outline" size={60} color="#FFFFFF" style={{ marginBottom: 20 }} /><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorRetryButton}><Text style={styles.errorRetryButtonText}>Go Back</Text></TouchableOpacity></SafeAreaView></View> ); }
  if (!startCoords || (initialDestination && !destinationCoords)) { return ( <View style={styles.backgroundView}><StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} /><SafeAreaView style={[styles.safeAreaContent, styles.centered]}><Ionicons name="help-circle-outline" size={60} color="#FFFFFF" style={{ marginBottom: 20 }} /><Text style={styles.errorText}>Route information incomplete.</Text><TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorRetryButton}><Text style={styles.errorRetryButtonText}>Go Back</Text></TouchableOpacity></SafeAreaView></View> ); }

  return (
    <View style={styles.backgroundView}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.safeAreaContent}>
        <View style={styles.container}>

          <View style={styles.addressContainer}>
             <View style={styles.inputRow}><Ionicons name="radio-button-on-outline" size={20} color="#FFFFFF" style={styles.inputIcon} /><Text style={styles.addressText} numberOfLines={1}>Current Location</Text></View>
             {initialDestination && destinationCoords && (<View style={styles.inputRow}><Ionicons name="location-outline" size={20} color="#FFFFFF" style={styles.inputIcon} /><Text style={styles.addressText} numberOfLines={1}>{initialDestination}</Text></View>)}
          </View>

          <View style={styles.mapCard}>
             <MapView ref={mapRef} style={styles.map} provider="google" showsUserLocation={true} initialRegion={startCoords ? { latitude: startCoords.latitude, longitude: startCoords.longitude, latitudeDelta: 0.02, longitudeDelta: 0.01, } : undefined} onMapReady={() => { if (startCoords) { fitMapToCoordinates(); } } } >
                 {startCoords && <Marker coordinate={startCoords} title="Start" pinColor="red" />}
                 {destinationCoords && <Marker coordinate={destinationCoords} title="Destination" pinColor="green" />}
                 {startCoords && destinationCoords && ( <MapViewDirections origin={startCoords} destination={destinationCoords} apikey={API_KEY} mode={selectedMode} strokeWidth={4} strokeColor="#4A90E2" onError={(errorMessage) => { console.error('MapViewDirections Error:', errorMessage); Alert.alert('Route Error', `Could not find ${selectedMode} route.`); }} /> )}
             </MapView>
             <TouchableOpacity style={styles.floatingCenterButton} onPress={fitMapToCoordinates}>
                  <Ionicons name="locate-outline" size={24} color="#483bcb" />
              </TouchableOpacity>
          </View>

           {initialDestination && destinationCoords && (
              <View style={styles.modeButtonsContainer}>
                 {TRANSPORT_MODES.map((mode) => { const timeInMinutes = travelTimes[mode] !== undefined ? Math.round(travelTimes[mode]! / 60) : null; const isSelected = selectedMode === mode; const modeBackgroundColor = mode === 'WALKING' ? '#F0A0A0' : mode === 'DRIVING' ? '#A1DE93' : mode === 'TRANSIT' ? '#FFE15D' : '#ddd'; return (
                      <TouchableOpacity key={mode} style={[ styles.modeButton, { backgroundColor: modeBackgroundColor }, isSelected && styles.modeButtonSelected, timeInMinutes === null && styles.modeButtonDisabled, ]} onPress={() => setSelectedMode(mode)} disabled={timeInMinutes === null} >
                          <Ionicons name={getModeIcon(mode)} size={28} color={isSelected ? '#000' : (timeInMinutes === null ? '#aaa' : '#444')} />
                          {timeInMinutes !== null ? ( <Text style={[styles.modeTimeText, isSelected && styles.modeTimeTextSelected]}> {timeInMinutes} min </Text> ) : ( <Text style={[styles.modeTimeText, styles.modeTimeTextDisabled]}>N/A</Text> )}
                      </TouchableOpacity> );
                 })}
              </View>
           )}

           {initialDestination && destinationCoords && (
               <View style={styles.bottomActionContainer}>
                    <TouchableOpacity style={[styles.bottomButtonBase, styles.goBackButton]} onPress={handleGoBack}>
                        <Ionicons name="arrow-back-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.bottomButtonText}>Back</Text>
                    </TouchableOpacity>

                   <TouchableOpacity style={[styles.bottomButtonBase, styles.startNavigationButton]} onPress={handleStartNavigation}>
                       <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
                       <Text style={styles.bottomButtonText}>Start</Text>
                   </TouchableOpacity>

                   <TouchableOpacity style={[styles.bottomButtonBase, styles.saveRouteButton]} onPress={handleSaveRoute}>
                       <Ionicons name="bookmark-outline" size={20} color="#FFFFFF" />
                       <Text style={styles.bottomButtonText}>Save</Text>
                   </TouchableOpacity>
               </View>
           )}

            {(!initialDestination || !destinationCoords) && startCoords && (
                 <TouchableOpacity style={styles.goBackButtonAlone} onPress={handleGoBack}>
                      <Ionicons name="arrow-back-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.goBackButtonText}>Go Back</Text>
                  </TouchableOpacity>
            )}

        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
    backgroundView: { flex: 1, backgroundColor: '#483bcb', },
    safeAreaContent: { flex: 1, },
    container: { flex: 1, paddingHorizontal: 20, paddingBottom: 10, },
    centered: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, },
    addressContainer: { marginTop: Platform.OS === 'ios' ? 10 : 25, marginBottom: 15, },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, marginBottom: 10, },
    inputIcon: { marginRight: 10, },
    addressText: { flex: 1, fontSize: 16, color: '#FFFFFF', },
    mapCard: { flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: '#ccc', position: 'relative', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 5, },
    map: { ...StyleSheet.absoluteFillObject, },
    floatingCenterButton: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 25, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, },
    modeButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, },
    modeButton: { flex: 1, aspectRatio: 1, marginHorizontal: 5, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, },
    modeButtonSelected: { borderWidth: 2, borderColor: '#FFFFFF', elevation: 4, shadowOpacity: 0.2, },
    modeButtonDisabled: { opacity: 0.6, elevation: 0, shadowOpacity: 0, },
    modeTimeText: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 5, },
    modeTimeTextSelected: { color: '#000', },
    modeTimeTextDisabled: { color: '#aaa', },
    bottomActionContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 5, },
    bottomButtonBase: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 25, marginHorizontal: 4, minHeight: 46, elevation: 2, flexShrink: 1 },
    bottomButtonText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600', marginLeft: 6, },
    goBackButton: { backgroundColor: 'rgba(0, 0, 0, 0.2)', flex: 0.8 },
    startNavigationButton: { backgroundColor: '#4CAF50', flex: 1.2 },
    saveRouteButton: { backgroundColor: 'rgba(255, 255, 255, 0.3)', flex: 1 },
    goBackButtonAlone: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, alignSelf: 'center', marginHorizontal: 5, justifyContent: 'center', marginBottom: 10, },
    goBackButtonText: { fontSize: 15, color: '#FFFFFF', fontWeight: '600', marginLeft: 8, },
    loadingText: { marginTop: 16, color: '#FFFFFF', fontSize: 16, textAlign: 'center', },
    errorText: { color: '#FFFFFF', fontSize: 18, marginBottom: 20, textAlign: 'center', },
    errorRetryButton: { backgroundColor: 'rgba(255, 255, 255, 0.3)', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20, },
    errorRetryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', },
});

export default MapScreen;