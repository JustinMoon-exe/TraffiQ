import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  const handleReset = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Success', 'All local data has been cleared');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error clearing storage:', error);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>App Settings</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Clear All Saved Data</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#6200EE',
  },
  button: {
    backgroundColor: '#E53935',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  versionText: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: '#888',
  },
});

export default SettingsScreen;