import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// firebase config, javni je ovo pa nije problem da je u kodu
const firebaseConfig = {
  apiKey: "AIzaSyBEkfK-Vnd0XLdAxUnAQbChXgw19Jf_GeY",
  authDomain: "booking-8b103.firebaseapp.com",
  projectId: "booking-8b103",
  storageBucket: "booking-8b103.firebasestorage.app",
  messagingSenderId: "1007591430481",
  appId: "1:1007591430481:web:c5f6fa5effd0873fc0db70",
  measurementId: "G-BQX84QS7SL",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
