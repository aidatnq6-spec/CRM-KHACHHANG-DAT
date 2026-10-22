import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import original from "./legacy-config.json";

export function firebaseClient() {
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || original.apiKey,
        authDomain:
          process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || original.authDomain,
        projectId:
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || original.projectId,
        storageBucket:
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
          original.storageBucket,
        messagingSenderId:
          process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
          original.messagingSenderId,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || original.appId,
      });
  return { auth: getAuth(app), db: getFirestore(app) };
}
