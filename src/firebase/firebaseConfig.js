// ============================================================
//  PASTE YOUR FIREBASE CREDENTIALS HERE
//  Get them from: Firebase Console → Project Settings → Your Apps
// ============================================================
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYH-0Ier0TUDYNIS7laNvb6xIstZALqM4",
  authDomain: "libraryproj-softeng.firebaseapp.com",
  projectId: "libraryproj-softeng",
  storageBucket: "libraryproj-softeng.firebasestorage.app",
  messagingSenderId: "680802241513",
  appId: "1:680802241513:web:574a3c7de4cdf9a93cd978",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Force account selection every time (good UX for shared devices)
googleProvider.setCustomParameters({ prompt: "select_account" });
