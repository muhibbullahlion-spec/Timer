// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection, 
  addDoc, 
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ⬇️⬇️ আপনার আসল Firebase config এখানে বসান ⬇️⬇️
const firebaseConfig = {
  apiKey: "AIzaSyBBNQMlpPf2qIFGJ-CLp5qhaEazsADZytY",
  authDomain: "timer-ec0b2.firebaseapp.com",
  projectId: "timer-ec0b2",
  storageBucket: "timer-ec0b2.firebasestorage.app",
  messagingSenderId: "191338629296",
  appId: "1:191338629296:web:a7973e9e5d115c7f6c5375",
  measurementId: "G-QT4GPWQY20"
};
// ⬆️⬆️ আপনার আসল Firebase config এখানে বসান ⬆️⬆️

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// সব কিছু export করুন
export { 
  auth, db, googleProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, signOut, onAuthStateChanged, updateProfile,
  doc, setDoc, getDoc, updateDoc,
  collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc
};
