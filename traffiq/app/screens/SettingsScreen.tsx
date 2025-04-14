import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [preferences, setPreferences] = useState({
    gsuShuttlePriority: true,
    martaIntegration: true,
    bikeFriendly: false,
    realTimeAlerts: true,
    pushNotifications: true
  });

  useEffect(() => {
    const loadPreferences = async () => {
      const savedPrefs = await AsyncStorage.getItem('transportPreferences');
      if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
    };
    loadPreferences();
  }, []);

  const savePreferences = async (newPrefs: any) => {
    await AsyncStorage.setItem('transportPreferences', JSON.stringify(newPrefs));
    if (auth.currentUser?.uid) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        preferences: newPrefs
      });
    }
  };

  const handleToggle = (setting: string) => async (value: boolean) => {
    const newPrefs = { ...preferences, [setting]: value };
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  const handleReset = async () => {
    try {
      await AsyncStorage.clear();
      if (auth.currentUser?.uid) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          recentTrips: [],
          savedRoutes: []
        });
      }
      Alert.alert('Success', 'All local data has been cleared');
      navigation.navigate('HomeScreen');
    } catch (error) {
      console.error('Error clearing storage:', error);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.navigate('Logic');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>GSU Travel Preferences</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Optimization</Text>
        
        <PreferenceToggle
          label="Prioritize GSU Shuttles"
          value={preferences.gsuShuttlePriority}
          onToggle={handleToggle('gsuShuttlePriority')}
        />
        
        <PreferenceToggle
          label="Include MARTA Routes"
          value={preferences.martaIntegration}
          onToggle={handleToggle('martaIntegration')}
        />
        
        <PreferenceToggle
          label="Prefer Bike-friendly Routes"
          value={preferences.bikeFriendly}
          onToggle={handleToggle('bikeFriendly')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <PreferenceToggle
          label="Real-time Shuttle Alerts"
          value={preferences.realTimeAlerts}
          onToggle={handleToggle('realTimeAlerts')}
        />
        
        <PreferenceToggle
          label="Push Notifications"
          value={preferences.pushNotifications}
          onToggle={handleToggle('pushNotifications')}
        />
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dangerButton} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset All Data</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>TraffiQ v1.0 - GSU Edition</Text>
    </View>
  );
};

const PreferenceToggle = ({ label, value, onToggle }: any) => (
  <View style={styles.toggleContainer}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <Switch
      trackColor={{ false: '#767577', true: '#6200EE' }}
      thumbColor={value ? '#ffffff' : '#f4f3f4'}
      onValueChange={onToggle}
      value={value}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff', 
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#023c69', 
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#f9f9f9', 
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc', 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333', 
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', 
    paddingBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', 
  },
  toggleLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333', 
    marginRight: 15,
  },
  logoutButton: {
    backgroundColor: '#6200EE', 
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  dangerButton: {
    backgroundColor: '#E53935', 
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff', 
    fontWeight: '600',
    fontSize: 16,
  },
  versionText: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: '#888', 
    fontSize: 12,
  },
});
export default SettingsScreen;