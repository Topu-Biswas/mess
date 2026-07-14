// Server-side Firestore initialization
// Uses the Firebase client SDK (works in Node.js API routes without service account)
// Requires permissive Firestore rules: allow read, write: if true;
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBafnOMgJnV1y4oc2rkcToTWl5GbHw4JIo",
  authDomain: "mess-66852.firebaseapp.com",
  projectId: "mess-66852",
  storageBucket: "mess-66852.firebasestorage.app",
  messagingSenderId: "234091892220",
  appId: "1:234091892220:web:b0e7703434da5a6c1a7679",
  measurementId: "G-46JS6HJ3D4",
};

// Initialize on server (no window check needed for firebase/app)
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

export const adminDb = getFirestore();
export const adminAuth = null; // Not used — client-side Firebase Auth handles authentication
