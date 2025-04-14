// LogicScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { auth } from '../firebaseConfig';

type LogicScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Logic'>;

const LogicScreen = () => {
  const navigation = useNavigation<LogicScreenNavigationProp>();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        console.log("[LogicScreen] User already logged in, redirecting to Main...");
        navigation.replace('Main');
      } else {
        console.log("[LogicScreen] No user logged in.");
      }
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.backgroundView}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.safeAreaContent}>
        <View style={styles.container}>
          <Image
            source={require('../../assets/traffiq.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundView: {
    flex: 1,
    backgroundColor: '#483bcb',
  },
  safeAreaContent: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: '80%',
    height: 120,
    marginBottom: 60,
  },
  tagline: {
      fontSize: 18,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      marginBottom: 40,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  registerButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LogicScreen;