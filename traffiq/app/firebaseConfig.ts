// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';  // Use getAuth instead of initializeAuth if already initialized
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDwDsdgGQaRWBhDgEkyeNhwOPOOJHxpB04",
  authDomain: "traffiq-a742b.firebaseapp.com",
  projectId: "traffiq-a742b",
  storageBucket: "traffiq-a742b.appspot.com",
  messagingSenderId: "128940776716",
  appId: "1:128940776716:android:4e5aa09ad436ae37913d29"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // This initializes auth only once
export const db = getFirestore(app);
