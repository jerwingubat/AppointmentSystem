const firebaseConfig = {
    apiKey: "AIzaSyBRIyuxDhndABeMJng-fJRZJPaX_R7g7O8",
    authDomain: "appointment-system-6d7a5.firebaseapp.com",
    projectId: "appointment-system-6d7a5",
    storageBucket: "appointment-system-6d7a5.firebasestorage.app",
    messagingSenderId: "764916211566",
    appId: "1:764916211566:web:551c88b55cba38ba446b7f",
    measurementId: "G-PF964W9HCQ"
};
// Initialize Firebase (Compat way)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase initialized:", firebase);

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signup-form");

    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const firstName = document.getElementById("first-name").value.trim();
        const lastName = document.getElementById("last-name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;

                // Update display name in Firebase Auth
                return user.updateProfile({
                    displayName: `${firstName} ${lastName}`
                }).then(() => {
                    // Save user details in Firestore
                    return db.collection('users').doc(user.uid).set({
                        uid: user.uid,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
            })
            .then(() => {
                alert("Account created and user data stored in Firestore!");
                window.location.href = "/index.html"; // redirect if needed
            })
            .catch((error) => {
                alert(`Error: ${error.message}`);
                console.error(error);
            });
    });

    // Password strength meter
    const passwordInput = document.getElementById("password");
    const strengthMeter = document.getElementById("strength-meter");

    passwordInput.addEventListener("input", () => {
        const val = passwordInput.value;
        let strength = 0;

        if (val.length >= 6) strength++;
        if (/[A-Z]/.test(val)) strength++;
        if (/[0-9]/.test(val)) strength++;
        if (/[^A-Za-z0-9]/.test(val)) strength++;

        strengthMeter.style.width = `${(strength / 4) * 100}%`;
        strengthMeter.style.backgroundColor = ["red", "orange", "gold", "green"][strength - 1] || "transparent";
    });
});
