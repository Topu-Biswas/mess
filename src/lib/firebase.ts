// Firebase client-side initialization
// IMPORTANT: This file is client-only. Never import in server components.
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getMessaging, type Messaging } from "firebase/messaging";
import { getStorage, type FirebaseStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyBafnOMgJnV1y4oc2rkcToTWl5GbHw4JIo",
  authDomain: "mess-66852.firebaseapp.com",
  projectId: "mess-66852",
  storageBucket: "mess-66852.firebasestorage.app",
  messagingSenderId: "234091892220",
  appId: "1:234091892220:web:b0e7703434da5a6c1a7679",
  measurementId: "G-46JS6HJ3D4",
};

// Initialize app once (singleton)
let app: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;
let authInstance: Auth | null = null;
let messagingInstance: Messaging | null = null;
let storageInstance: FirebaseStorage | null = null;

if (typeof window !== "undefined" && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else if (typeof window !== "undefined") {
  app = getApps()[0];
}

// Analytics (client + measurementId supported)
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
    // analytics not supported (e.g. privacy mode)
  }
  return null;
}

// Auth
export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined" || !app) return null;
  if (!authInstance) authInstance = getAuth(app);
  return authInstance;
}

export const googleProvider = new GoogleAuthProvider();

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

// Storage
export function getFirebaseStorage(): FirebaseStorage | null {
  if (typeof window === "undefined" || !app) return null;
  if (!storageInstance) storageInstance = getStorage(app);
  return storageInstance;
}

export { app };
