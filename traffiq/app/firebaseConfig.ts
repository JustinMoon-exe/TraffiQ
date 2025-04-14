// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// --- Import necessary auth functions and AsyncStorage ---
import {
  initializeAuth,
  getReactNativePersistence // Verified import path for v9+
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDwDsdgGQaRWBhDgEkyeNhwOPOOJHxpB04", // Consider using environment variables
  authDomain: "traffiq-a742b.firebaseapp.com",
  projectId: "traffiq-a742b",
  storageBucket: "traffiq-a742b.appspot.com",
  messagingSenderId: "128940776716",
  appId: "1:128940776716:android:4e5aa09ad436ae37913d29"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth with Persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Export the initialized services
export { auth, db };