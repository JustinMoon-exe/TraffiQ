// LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView, // Import
  StatusBar,    // Import
  Image,        // Import
  Platform,     // Import
  KeyboardAvoidingView // Import for keyboard handling
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types'; // Adjust path if needed
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons

// Use the specific navigation prop type from your types file or defined inline
type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Corrected login logic ---
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { // Trim input before checking
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      console.log("Attempting login..."); // Log start
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password); // Use trimmed values
      console.log("Login successful for user:", userCredential.user.uid); // Log success

      // --- *** ENSURE THIS LINE IS PRESENT AND CORRECT *** ---
      // Navigate to the main part of the app after successful login.
      // 'Main' should be the name of the screen in your RootNavigator that holds the TabNavigator.
      navigation.replace('Main');
      // --- *** ---

    } catch (error: any) {
      console.error('Login error:', error.code, error.message); // Log error code and message
      // Provide more user-friendly error messages
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Access temporarily disabled due to too many failed login attempts. Please try again later.';
      }
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  // --- End of login logic ---

  return (
    // --- Apply themed structure ---
    <View style={styles.backgroundView}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.safeAreaContent}>
        {/* Use KeyboardAvoidingView to prevent inputs being hidden */}
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoiding}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // Adjust offset if needed
        >
           {/* Inner container for centering and padding */}
            <View style={styles.container}>
                {/* --- Logo --- */}
                <Image
                    source={require('../../assets/traffiq.png')} // Verify path
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* --- Themed Inputs --- */}
                <View style={styles.inputContainer}>
                     <Ionicons name="mail-outline" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                     <TextInput
                        placeholder="Email"
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="rgba(255, 255, 255, 0.7)" // Light placeholder
                        returnKeyType="next" // Indicate next field
                        onSubmitEditing={() => { /* Optionally focus next input ref */ }}
                     />
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                    <TextInput
                        placeholder="Password"
                        style={styles.input}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        returnKeyType="go" // Indicate final action
                        onSubmitEditing={handleLogin} // Trigger login on submit
                    />
                </View>

                {/* --- Loading or Login Button --- */}
                {loading ? (
                    <ActivityIndicator size="large" color="#FFFFFF" style={styles.loadingIndicator}/>
                ) : (
                    <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.8}>
                    <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                )}

                {/* --- Switch to Register Screen --- */}
                <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchButton}>
                    <Text style={styles.switchText}>Don't have an account? </Text>
                    <Text style={[styles.switchText, styles.switchLink]}>Register</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// --- Styles incorporating the theme (Keep as before) ---
const styles = StyleSheet.create({
  backgroundView: { flex: 1, backgroundColor: '#483bcb', },
  safeAreaContent: { flex: 1, },
  keyboardAvoiding: { flex: 1, justifyContent: 'center', },
  container: { paddingHorizontal: 30, alignItems: 'center', width: '100%', },
  logo: { width: '75%', height: 100, marginBottom: 40, },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12, marginBottom: 18, paddingHorizontal: 15, width: '100%', },
  inputIcon: { marginRight: 10, },
  input: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 14 : 12, fontSize: 16, color: '#FFFFFF', },
  button: { backgroundColor: 'rgba(255, 255, 255, 0.3)', paddingVertical: 15, borderRadius: 25, alignItems: 'center', width: '100%', marginTop: 10, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 3, },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, },
  loadingIndicator: { marginVertical: 15, paddingVertical: 15, },
  switchButton: { flexDirection: 'row', marginTop: 15, },
  switchText: { textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, },
  switchLink: { fontWeight: 'bold', textDecorationLine: 'underline', color: '#FFFFFF', }
});

export default LoginScreen;