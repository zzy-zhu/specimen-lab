import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

/* Specimen.lab — Firebase Realtime Database.
   Config is public by design (client SDK). Access is governed by
   database rules in the Firebase console. */
const firebaseConfig = {
  apiKey: "AIzaSyCQnffc9MlD-QIl1s15R-gS2i7ssH1Gr_E",
  authDomain: "specimen-lab.firebaseapp.com",
  databaseURL: "https://specimen-lab-default-rtdb.firebaseio.com",
  projectId: "specimen-lab",
  storageBucket: "specimen-lab.firebasestorage.app",
  messagingSenderId: "221689358158",
  appId: "1:221689358158:web:74256ef4641b1a5620601f",
  measurementId: "G-WZDJS8BB4T",
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

/* Rooms are per-event and live in data/events.js — the store attaches to
   rooms/<event.room>. VITE_EVENT_ID still overrides the LA room. */
