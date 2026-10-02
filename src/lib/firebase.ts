import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore, type Firestore } from "firebase/firestore";

import { FIREBASE_CONFIG } from "../firebase-config";

// Ortam değişkeni verilmişse (yerel test) onu, yoksa src/firebase-config.ts içindeki değerleri kullanır
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || FIREBASE_CONFIG.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || FIREBASE_CONFIG.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || FIREBASE_CONFIG.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || FIREBASE_CONFIG.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_CONFIG.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || FIREBASE_CONFIG.appId,
};

/** Firebase yapılandırması girilmiş mi? */
export const firebaseReady = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let _app: FirebaseApp | null = null;
function app() {
  if (!firebaseReady) throw new Error("Firebase yapılandırması eksik (.env.local veya GitHub ayarları).");
  if (!_app) _app = getApps()[0] ?? initializeApp(firebaseConfig);
  return _app;
}

let _db: Firestore | null = null;
let _auth: Auth | null = null;

// Yerel test: NEXT_PUBLIC_USE_EMULATOR=1 ise Firebase emülatörlerine bağlanır
const emulator = process.env.NEXT_PUBLIC_USE_EMULATOR === "1";

export const fdb = () => {
  if (!_db) {
    _db = initializeFirestore(app(), { ignoreUndefinedProperties: true });
    if (emulator) connectFirestoreEmulator(_db, "127.0.0.1", 8080);
  }
  return _db;
};
export const fauth = () => {
  if (!_auth) {
    _auth = getAuth(app());
    if (emulator) connectAuthEmulator(_auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return _auth;
};

/** Başka kullanıcı hesabı oluşturmak için ikincil uygulama (mevcut oturumu bozmadan) */
export function secondaryAuth() {
  const name = "secondary";
  const existing = getApps().find((a) => a.name === name);
  const a = getAuth(existing ?? initializeApp(firebaseConfig, name));
  if (emulator && !existing) connectAuthEmulator(a, "http://127.0.0.1:9099", { disableWarnings: true });
  return a;
}
