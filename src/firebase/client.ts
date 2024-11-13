import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyBAoKbTGJ5HWY35u2jKhsujnnlO5MgVFoU",
    authDomain: "farmalyst-demo.firebaseapp.com",
    projectId: "farmalyst-demo",
    storageBucket: "farmalyst-demo.firebasestorage.app",
    messagingSenderId: "1023967857416",
    appId: "1:1023967857416:web:72d16583aff532cfb33abd",
    measurementId: "G-ZJ1LY3E1F7"
  };

export const app = initializeApp(firebaseConfig);