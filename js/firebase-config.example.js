// Copy this file to firebase-config.js and fill in your Firebase credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make auth available globally (IMPORTANT!)
window.auth = firebase.auth();
// Google Provider
window.googleProvider = new firebase.auth.GoogleAuthProvider();
