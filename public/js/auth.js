// auth.js
import { auth } from '../../firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const errorDisplay = document.getElementById("loginError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm.email.value;
  const password = loginForm.password.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html"; // Başarılı girişte yönlendir
  } catch (error) {
    errorDisplay.textContent = "Giriş başarısız: " + error.message;
  }
});
