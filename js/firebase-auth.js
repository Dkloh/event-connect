// Firebase Authentication Handler
(function() {
  'use strict';

  // Check if Firebase and auth are loaded
  if (typeof firebase === 'undefined') {
    console.error('Firebase not loaded! Check script tags.');
    return;
  }

  if (typeof auth === 'undefined') {
    console.error('Auth not defined! Check firebase-config.js');
    return;
  }

  // Wait for DOM and Firebase
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // Check if we're on login page
    if (document.getElementById('loginFormElement')) {
      setupAuthPage();
    }
    
    // Listen for auth state changes globally
    setupAuthStateListener();
  }

  // Setup login/signup page
  function setupAuthPage() {
    setupTabSwitching();
    setupEmailAuth();
    setupGoogleAuth();
  }

  // Listen for auth state changes
  function setupAuthStateListener() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in
        updateCurrentUser(user);
      } else {
        // User is signed out
        localStorage.removeItem('currentUser');
      }
    });
  }

  // Update currentUser in localStorage
  function updateCurrentUser(firebaseUser) {
    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userData));
  }

  // Check if current user is admin (from Firestore)
  window.isUserAdmin = function(callback) {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        callback(false);
        return;
      }
      
      try {
        // Check Firestore for admin status
        const db = firebase.firestore();
        const adminDoc = await db.collection('admins').doc(user.uid).get();
        const isAdmin = adminDoc.exists && adminDoc.data().isAdmin === true;
        callback(isAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        callback(false);
      }
    });
  };

  // Tab switching
  function setupTabSwitching() {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');

    function showLogin() {
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
      clearErrors();
    }

    function showSignup() {
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
      signupForm.style.display = 'block';
      loginForm.style.display = 'none';
      clearErrors();
    }

    if (loginTab) loginTab.addEventListener('click', showLogin);
    if (signupTab) signupTab.addEventListener('click', showSignup);
    if (switchToSignup) switchToSignup.addEventListener('click', (e) => {
      e.preventDefault();
      showSignup();
    });
    if (switchToLogin) switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      showLogin();
    });
  }

  // Email/Password Authentication
  function setupEmailAuth() {
    const loginForm = document.getElementById('loginFormElement');
    const signupForm = document.getElementById('signupFormElement');

    if (loginForm) {
      loginForm.addEventListener('submit', handleEmailLogin);
    }

    if (signupForm) {
      signupForm.addEventListener('submit', handleEmailSignup);
    }
  }

  // Handle email login
  async function handleEmailLogin(e) {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showError('loginEmail', 'Please enter email and password');
      return;
    }

    showLoading(true);

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      
      // Redirect to home
      window.location.href = 'index.html';
      
    } catch (error) {
      showLoading(false);
      console.error('Login error:', error);
      handleAuthError(error, 'login');
    }
  }

  // Handle email signup
  async function handleEmailSignup(e) {
    e.preventDefault();
    clearErrors();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    // Validate
    if (!name) {
      showError('signupName', 'Name is required');
      return;
    }

    if (!email) {
      showError('signupEmail', 'Email is required');
      return;
    }

    if (!isValidEmail(email)) {
      showError('signupEmail', 'Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      showError('signupPassword', 'Password must be at least 6 characters');
      return;
    }

    showLoading(true);

    try {
      // Create account
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      
      // Update profile with name
      await userCredential.user.updateProfile({
        displayName: name
      });

      // Create user profile in Firestore
      const db = firebase.firestore();
      await db.collection('users').doc(userCredential.user.uid).set({
        uid: userCredential.user.uid,
        name: name,
        email: email,
        photoURL: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Redirect to home
      window.location.href = 'index.html';
      
    } catch (error) {
      showLoading(false);
      console.error('Signup error:', error);
      handleAuthError(error, 'signup');
    }
  }

  // Google Authentication
  function setupGoogleAuth() {
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const googleSignUpBtn = document.getElementById('googleSignUpBtn');

    if (googleSignInBtn) {
      googleSignInBtn.addEventListener('click', handleGoogleAuth);
    }

    if (googleSignUpBtn) {
      googleSignUpBtn.addEventListener('click', handleGoogleAuth);
    }
  }

  // Handle Google sign in/up
  async function handleGoogleAuth() {
    showLoading(true);

    try {
        const result = await auth.signInWithPopup(googleProvider);
        
        // Update localStorage with user data (same as email login)
        updateCurrentUser(result.user);
        
        // Create or update user profile in Firestore (non-blocking, try but don't fail if it errors)
        try {
          const db = firebase.firestore();
          const userRef = db.collection('users').doc(result.user.uid);
          const userDoc = await userRef.get();
          
          if (!userDoc.exists) {
            // New user - create profile
            await userRef.set({
              uid: result.user.uid,
              name: result.user.displayName || result.user.email.split('@')[0],
              email: result.user.email,
              photoURL: result.user.photoURL,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        } catch (firestoreError) {
          console.warn('Firestore profile creation failed (non-blocking):', firestoreError);
          // Don't block login if Firestore fails
        }
        
        // Redirect to home
        window.location.href = 'index.html';
    } catch (error) {
        showLoading(false);
        console.error('Google auth error:', error);

        // Enhanced error handling
        if (error.code === 'auth/popup-closed-by-user') {
            console.warn('Popup closed by user.');
            return;
        }

        // Log additional error details
        console.error('Error details:', error);
        handleAuthError(error, 'google');
    }
  }

  // Handle auth errors
  function handleAuthError(error, context) {
    let message = 'An error occurred. Please try again.';
    let fieldId = context === 'login' ? 'loginEmail' : 'signupEmail';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered. Try logging in instead.';
        fieldId = 'signupEmail';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email.';
        fieldId = 'loginEmail';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password.';
        fieldId = 'loginPassword';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters.';
        fieldId = 'signupPassword';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Check your internet connection.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Try again later.';
        break;
      default:
        message = error.message;
    }

    showError(fieldId, message);
  }

  // Show loading state
  function showLoading(show) {
    const loadingEl = document.getElementById('authLoading');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loadingEl) {
      loadingEl.style.display = show ? 'block' : 'none';
    }

    if (loginForm) {
      loginForm.style.display = show ? 'none' : 'block';
    }

    if (signupForm) {
      signupForm.style.display = show ? 'none' : 'none'; // Keep hidden unless active
    }
  }

  // Helper: Validate email
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Helper: Show error
  function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    
    if (input) {
      input.classList.add('error');
    }
    
    if (error) {
      error.textContent = message;
      error.classList.add('active');
    }
  }

  // Helper: Clear errors
  function clearErrors() {
    const errors = document.querySelectorAll('.form-error');
    const inputs = document.querySelectorAll('.form-input');
    
    errors.forEach(error => {
      error.textContent = '';
      error.classList.remove('active');
    });
    
    inputs.forEach(input => {
      input.classList.remove('error');
    });
  }

})();

// Global auth utilities
window.AuthUtils = {
  // Check if user is logged in
  isLoggedIn: function() {
    return auth.currentUser !== null;
  },

  // Get current user
  getCurrentUser: function() {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  },

  // Logout
  logout: async function() {
    try {
      await auth.signOut();
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out. Please try again.');
    }
  },

  // Require login (redirect if not logged in)
  requireLogin: function() {
    if (!auth.currentUser) {
      window.location.href = 'login.html';
    }
  },

  // Get Firebase user
  getFirebaseUser: function() {
    return auth.currentUser;
  }
};