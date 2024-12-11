import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCTtID9dzx-g54Hbg9qFOyodOfIGMex310",
  authDomain: "farmiemos-dashboard.firebaseapp.com",
  projectId: "farmiemos-dashboard",
  storageBucket: "farmiemos-dashboard.firebasestorage.app",
  messagingSenderId: "843204193003",
  appId: "1:843204193003:web:1fa42efa98dd6cd6c56cae",
  measurementId: "G-VETBPX2K8C"
};

export const app = initializeApp(firebaseConfig);