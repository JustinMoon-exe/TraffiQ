import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapScreen({ route, navigation }) {
  const { destination } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Destination: {destination}</Text>
      <MapView 
        style={styles.map} 
        initialRegion={{
          latitude: 33.7490,
          longitude: -84.3880,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker coordinate={{ latitude: 33.7490, longitude: -84.3880 }} title={destination} />
      </MapView>
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  map: { flex: 1, width: '100%' },
});
