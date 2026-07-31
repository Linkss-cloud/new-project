import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD-nUtWeFqHLCWPOQaFDCgmHfCGjf7L6Mo",
  authDomain: "sports-zone-ed3a9.firebaseapp.com",
  projectId: "sports-zone-ed3a9",
  storageBucket: "sports-zone-ed3a9.firebasestorage.app",
  messagingSenderId: "705661983451",
  appId: "1:705661983451:web:93cfd75895a3b20cdecafe"
};

const app = initializeApp(firebaseConfig);

export { app };

export const db = getFirestore(app);
export const auth = getAuth(app);