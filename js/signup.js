const firebaseConfig = {
    apiKey: "AIzaSyBRIyuxDhndABeMJng-fJRZJPaX_R7g7O8",
    authDomain: "appointment-system-6d7a5.firebaseapp.com",
    projectId: "appointment-system-6d7a5",
    storageBucket: "appointment-system-6d7a5.appspot.com", // Not used here
    messagingSenderId: "764916211566",
    appId: "1:764916211566:web:551c88b55cba38ba446b7f",
    measurementId: "G-PF964W9HCQ"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let base64Image = ""; // Base64 image string to store in Firestore

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signup-form");
    const profilePicInput = document.getElementById("profile-pic");
    const fileChosen = document.getElementById("file-chosen");
    const preview = document.getElementById("preview");

    profilePicInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            fileChosen.textContent = file.name;

            const reader = new FileReader();
            reader.onload = function (e) {
                base64Image = e.target.result; // Store Base64 string
                preview.src = base64Image;
                preview.style.display = "block";
            };
            reader.readAsDataURL(file);
        } else {
            fileChosen.textContent = "No file chosen";
            preview.style.display = "none";
        }
    });

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

        if (!base64Image) {
            alert("Please select a profile picture.");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;

                // Note: Skipping user.updateProfile() to avoid 'photoURL too long' error

                // Save user info including Base64 profile picture in Firestore
                return db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    profilePicBase64: base64Image, // store Base64 string here
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                alert("Account created successfully with Base64 profile picture stored in Firestore!");
                window.location.href = "/index.html"; // redirect to your desired page
            })
            .catch((error) => {
                console.error("Signup Error:", error);
                alert("Error: " + error.message);
            });
    });
});