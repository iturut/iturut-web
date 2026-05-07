import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,  // ← Eksik olan bu
  doc,
  serverTimestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyADMe0qyQHtXRcc4_5Ph9_u54lpAZ38zn0",
  authDomain: "iturutnotes.firebaseapp.com",
  projectId: "iturutnotes",
  storageBucket: "iturutnotes.appspot.com",
  messagingSenderId: "297342013490",
  appId: "1:297342013490:web:085079b128f4a059baac2b",
  measurementId: "G-JKFZL9M4P2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,  // ← Eksik olan bu
  doc,
  serverTimestamp,
  orderBy
};
