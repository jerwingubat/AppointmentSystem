const firebaseConfig = {
    apiKey: "AIzaSyBRIyuxDhndABeMJng-fJRZJPaX_R7g7O8",
    authDomain: "appointment-system-6d7a5.firebaseapp.com",
    projectId: "appointment-system-6d7a5",
    storageBucket: "appointment-system-6d7a5.appspot.com",
    messagingSenderId: "764916211566",
    appId: "1:764916211566:web:551c88b55cba38ba446b7f",
    measurementId: "G-PF964W9HCQ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

console.log("Firebase Auth Ready");

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        document.getElementById("spinner-overlay").style.display = "flex";

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                alert(`Welcome back, ${user.displayName || user.email}!`);
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                console.error("Login error:", error);
                alert("Login failed: " + error.message);
            })
            .finally(() => {
                document.getElementById("spinner-overlay").style.display = "none";
            });
    });
});
