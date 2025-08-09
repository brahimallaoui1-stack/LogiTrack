// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "expensetrack-cwxtw",
  "appId": "1:738703556790:web:e87b7a7745e72468296617",
  "storageBucket": "expensetrack-cwxtw.firebasestorage.app",
  "apiKey": "AIzaSyCmCD0dTiNFDT3Kubi_0gTbN2zjJkPyOho",
  "authDomain": "expensetrack-cwxtw.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "738703556790"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const auth = getAuth(app);
