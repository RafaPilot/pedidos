import { initializeApp } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgZXFc7G66eFERtb9ahkMIyPa1QQR8zOM",
  authDomain: "pedidos-70482.firebaseapp.com",
  projectId: "pedidos-70482",
  storageBucket: "pedidos-70482.appspot.com",
  messagingSenderId: "482283129477",
  appId: "1:482283129477:web:8286684b8e5e9e134ab7ec",
  measurementId: "G-BE8LV1LKSS",
};

// Inicializa Firebase
export const app = initializeApp(firebaseConfig);
// Inicializa Auth
export const auth = getAuth(app);
