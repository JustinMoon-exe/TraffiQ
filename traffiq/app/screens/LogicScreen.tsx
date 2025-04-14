// LogicScreen.tsx
import React, { useEffect } from 'react'; // Added useEffect
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView, // Import
  StatusBar,    // Import
  Platform      // Import
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types'; // Adjust path if needed
import { auth } from '../firebaseConfig'; // Import auth to check login state

// Use the specific navigation prop type
type LogicScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Logic'>;

const LogicScreen = () => {
  const navigation = useNavigation<LogicScreenNavigationProp>();

  // --- Optional: Check Auth State on Mount ---
  // If a user is already logged in (persistence worked),
  // redirect them immediately to the main app screen.
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        console.log("[LogicScreen] User already logged in, redirecting to Main...");
        // Use replace so the user can't go back to Logic screen
        navigation.replace('Main');
      } else {
        console.log("[LogicScreen] No user logged in.");
        // No redirection needed, user stays on Logic screen
      }
    });

    // Cleanup the listener when the component unmounts
    return unsubscribe;
  }, [navigation]); // Dependency array includes navigation

  return (
    // --- Apply themed structure ---
    <View style={styles.backgroundView}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.safeAreaContent}>
        <View style={styles.container}>
          {/* --- App Logo --- */}
          <Image
            source={require('../../assets/traffiq.png')} // Verify path
            style={styles.logo}
            resizeMode="contain"
          />

          {/* --- Tagline or Welcome Text (Optional) --- */}
          {/* <Text style={styles.tagline}>Your Smart Transit Companion</Text> */}

          {/* --- Themed Buttons --- */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')} // Keep navigation
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
             // Apply slightly different style for secondary action if desired
            style={[styles.button, styles.registerButton]}
            onPress={() => navigation.navigate('Register')} // Keep navigation
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

// --- Styles incorporating the theme ---
const styles = StyleSheet.create({
  backgroundView: { // Outermost container
    flex: 1,
    backgroundColor: '#483bcb', // Theme background
  },
  safeAreaContent: { // Handles notches/bars
    flex: 1,
    justifyContent: 'center', // Center content vertically within safe area
  },
  container: { // Inner container for padding and alignment
    alignItems: 'center', // Center items horizontally
    paddingHorizontal: 40, // Generous horizontal padding
  },
  logo: {
    width: '80%', // Make logo prominent
    height: 120, // Adjust height as needed
    marginBottom: 60, // More space below logo
  },
  tagline: { // Optional text style
      fontSize: 18,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      marginBottom: 40,
  },
  button: { // Base button style (Login)
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Semi-transparent white
    paddingVertical: 16, // Make buttons taller
    borderRadius: 30, // Fully rounded ends
    alignItems: 'center',
    width: '100%', // Full width relative to container padding
    marginBottom: 20, // Space between buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  registerButton: { // Specific style for Register button (optional difference)
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Darker transparent for contrast
  },
  buttonText: { // Text style for both buttons
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Removed unused original styles
});

export default LogicScreen;