"use client";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase";

export async function uploadImage(file: File, path: string): Promise<string | null> {
  const storage = getFirebaseStorage();
  if (!storage) return null;
  try {
    const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch {
    return null;
  }
}

// Upload multiple images, return array of URLs (skips failures)
export async function uploadImages(files: File[], path: string): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadImage(file, path);
    if (url) urls.push(url);
  }
  return urls;
}
