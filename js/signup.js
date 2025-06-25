const firebaseConfig = {
    apiKey: "AIzaSyBRIyuxDhndABeMJng-fJRZJPaX_R7g7O8",
    authDomain: "appointment-system-6d7a5.firebaseapp.com",
    projectId: "appointment-system-6d7a5",
    storageBucket: "appointment-system-6d7a5.appspot.com",
    messagingSenderId: "764916211566",
    appId: "1:764916211566:web:551c88b55cba38ba446b7f",
    measurementId: "G-PF964W9HCQ"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let base64Image = "";

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
                base64Image = e.target.result;
                preview.src = base64Image;
                preview.style.display = "block";
            };
            reader.readAsDataURL(file);
        } else {
            fileChosen.textContent = "No file chosen";
            preview.style.display = "none";
        }
    });

    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const firstName = document.getElementById("first-name").value.trim();
        const lastName = document.getElementById("last-name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        const secretKey = document.getElementById("secret-key").value.trim();

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (!base64Image) {
            alert("Please select a profile picture.");
            return;
        }

        try {
            const keyQuery = await db.collection("secretKey")
                .where("value", "==", secretKey)
                .get();

            if (keyQuery.empty) {
                alert("Invalid secret key. Please contact the administrator.");
                return;
            }

            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                firstName: firstName,
                lastName: lastName,
                email: email,
                profilePicBase64: base64Image,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("Account created successfully!");
            window.location.href = "/index.html";

        } catch (error) {
            console.error("Signup Error:", error);
            alert("Error: " + error.message);
        }
    });

});