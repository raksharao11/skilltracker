// firebase.js
import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCoiKDgfA4wAyOaMOG9eX8ZOHiFP-NaQnw",
  authDomain: "skilltracker-dc08c.firebaseapp.com",
  projectId: "skilltracker-dc08c",
  storageBucket: "skilltracker-dc08c.appspot.com",  // fixed typo here too!
  messagingSenderId: "392999736247",
  appId: "1:392999736247:web:e3014305744131cc39ce32"
};

const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getFirestore(app);

export { auth, db };
//git test
