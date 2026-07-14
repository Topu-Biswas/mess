// Firebase client-side initialization
// IMPORTANT: This file is client-only. Never import in server components.
// All operations are wrapped in try-catch to prevent client-side crashes.
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getMessaging, type Messaging } from "firebase/messaging";
import { getFirestore, type Firestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBafnOMgJnV1y4oc2rkcToTWl5GbHw4JIo",
  authDomain: "mess-66852.firebaseapp.com",
  projectId: "mess-66852",
  storageBucket: "mess-66852.firebasestorage.app",
  messagingSenderId: "234091892220",
  appId: "1:234091892220:web:b0e7703434da5a6c1a7679",
  measurementId: "G-46JS6HJ3D4",
};

// Initialize app once (singleton) — wrapped in try-catch
let app: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;
let authInstance: Auth | null = null;
let messagingInstance: Messaging | null = null;
let firestoreInstance: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (typeof window !== "undefined") {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
  } catch {
    app = null;
  }
}

// Analytics
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined" || !app) return null;
  if (analyticsInstance) return analyticsInstance;
  try {
    const supported = await isSupported();
    if (supported) {
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    }
  } catch {
    // analytics not supported
  }
  return null;
}

// Auth
export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined" || !app) return null;
  if (!authInstance) {
    try {
      authInstance = getAuth(app);
    } catch {
      authInstance = null;
    }
  }
  return authInstance;
}

export function getGoogleProvider(): GoogleAuthProvider | null {
  if (!googleProvider) {
    try {
      googleProvider = new GoogleAuthProvider();
    } catch {
      googleProvider = null;
    }
  }
  return googleProvider;
}

// Messaging (FCM)
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined" || !app) return null;
  if (messagingInstance) return messagingInstance;
  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch {
    return null;
  }
}

// Firestore
export function getFirestoreDb(): Firestore | null {
  if (typeof window === "undefined" || !app) return null;
  if (!firestoreInstance) {
    try {
      firestoreInstance = getFirestore(app);
    } catch {
      firestoreInstance = null;
    }
  }
  return firestoreInstance;
}

export { app };
