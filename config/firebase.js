import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// PENTING: Untuk keamanan di GitHub, sebaiknya gunakan Environment Variables (.env)
// Contoh: apiKey: import.meta.env.VITE_FIREBASE_API_KEY
const firebaseConfig = {
  apiKey: "AIzaSyCPiFyAfY-7ryl3vtXjs7z5mGP5oOmEuMo",
  authDomain: "bhavanix-9dcef.firebaseapp.com",
  databaseURL: "https://bhavanix-9dcef-default-rtdb.firebaseio.com/",
  projectId: "bhavanix-9dcef",
  storageBucket: "bhavanix-9dcef.firebasestorage.app",
  messagingSenderId: "713166116354",
  appId: "1:713166116354:web:ddf06c19f50f2811d0b91b"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Sanitasi ID untuk path database
// Jika berjalan di lokal (bukan di editor ini), akan menggunakan 'default-app-id'
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
export const APP_ID = rawAppId.replace(/[.#$[\]]/g, '_'); 

export const ADMIN_EMAIL = "haf.hafian@gmail.com";
