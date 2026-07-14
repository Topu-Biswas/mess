// Server-side Firebase initialization for API routes
// Uses Firebase client SDK (works in both browser and Node.js/serverless)
// No firebase-admin needed — uses permissive Firestore rules instead
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBafnOMgJnV1y4oc2rkcToTWl5GbHw4JIo",
  authDomain: "mess-66852.firebaseapp.com",
  projectId: "mess-66852",
  storageBucket: "mess-66852.firebasestorage.app",
  messagingSenderId: "234091892220",
  appId: "1:234091892220:web:b0e7703434da5a6c1a7679",
  measurementId: "G-46JS6HJ3D4",
};

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

// Initialize Firebase app (works in both browser and Node.js)
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  dbInstance = getFirestore(app);
} catch (e) {
  // If initialization fails, dbInstance stays null
  console.error("Firebase init error:", e);
}

export const adminDb = dbInstance as Firestore;
export const adminAuth = null;
export const useAdmin = false;
