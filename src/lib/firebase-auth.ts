"use client";

import { signInWithPopup, signOut as fbSignOut, type User } from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase";

export interface GoogleSignInResult {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  phone: string | null;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Auth লোড হয়নি");
  const provider = getGoogleProvider();
  if (!provider) throw new Error("Google Provider লোড হয়নি");
  const result = await signInWithPopup(auth, provider);
  const user: User = result.user;
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    photoURL: user.photoURL,
    phone: user.phoneNumber,
  };
}

export async function firebaseSignOut() {
  const auth = getFirebaseAuth();
  if (auth) await fbSignOut(auth);
}
