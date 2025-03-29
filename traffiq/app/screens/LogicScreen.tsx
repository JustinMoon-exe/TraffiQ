// LogicScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/types';

type LogicScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Logic'>;

const LogicScreen = () => {
  const navigation = useNavigation<LogicScreenNavigationProp>();

  return (
    <View style={styles.container}>
      {/* App Logo */}
      <Image source={require('../../assets/traffiq.png')} style={styles.logo} />

      {/* Buttons */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  logo: { width: 150, height: 150, resizeMode: 'contain', marginBottom: 20 },
  tempBox: { width: '100%', padding: 20, backgroundColor: '#f0f0f0', borderRadius: 10, marginBottom: 20, alignItems: 'center' },
  tempBoxText: { fontSize: 16, color: '#333' },
  button: { backgroundColor: '#6200EE', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 8, marginBottom: 15 },
  secondaryButton: { backgroundColor: '#4CAF50' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default LogicScreen;
