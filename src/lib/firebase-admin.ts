// Server-side Firebase Admin SDK initialization
// Uses firebase-admin with service account for production (Vercel)
// Falls back to client SDK in development
import { initializeApp as initializeClientApp, getApps as getClientApps } from "firebase/app";
import { getFirestore as getClientFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBafnOMgJnV1y4oc2rkcToTWl5GbHw4JIo",
  authDomain: "mess-66852.firebaseapp.com",
  projectId: "mess-66852",
  storageBucket: "mess-66852.firebasestorage.app",
  messagingSenderId: "234091892220",
  appId: "1:234091892220:web:b0e7703434da5a6c1a7679",
  measurementId: "G-46JS6HJ3D4",
};

let adminDb: any = null;
let adminAuth: any = null;
let useAdmin = false;

// Initialize synchronously (no top-level await)
if (typeof window === "undefined") {
  try {
     
    const admin = require("firebase-admin");
     
    const adminApp = require("firebase-admin/app");

    if (!adminApp.getApps().length) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccountKey) {
        const serviceAccount = JSON.parse(
          Buffer.from(serviceAccountKey, "base64").toString("utf-8")
        );
        adminApp.initializeApp({ credential: adminApp.cert(serviceAccount) });
        useAdmin = true;
      } else {
        try {
          adminApp.initializeApp({ projectId: "mess-66852" });
          useAdmin = true;
        } catch {
          // Fall back to client SDK
        }
      }
    } else {
      useAdmin = true;
    }

    if (useAdmin) {
      adminDb = admin.firestore();
      adminAuth = admin.auth();
    }
  } catch {
    // firebase-admin not available — use client SDK
  }
}

// Fallback: use Firebase client SDK (works in Node.js with permissive Firestore rules)
if (!adminDb) {
  if (getClientApps().length === 0) {
    initializeClientApp(firebaseConfig);
  }
  adminDb = getClientFirestore();
}

export { adminDb, adminAuth, useAdmin };
