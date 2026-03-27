// Authentication System
(function() {
  'use strict';

  // Initialize
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupTabSwitching();
    setupFormHandlers();
  }

  // Tab switching between Login and Signup
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

  // Setup form handlers
  function setupFormHandlers() {
    const loginFormElement = document.getElementById('loginFormElement');
    const signupFormElement = document.getElementById('signupFormElement');

    if (loginFormElement) {
      loginFormElement.addEventListener('submit', handleLogin);
    }

    if (signupFormElement) {
      signupFormElement.addEventListener('submit', handleSignup);
    }
  }

  // Handle login
  function handleLogin(e) {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validate
    if (!email || !password) {
      showError('loginEmail', 'Please enter both email and password');
      return;
    }

    // Get users from localStorage
    const users = getUsersFromStorage();
    
    // Find user
    const user = users.find(u => u.email === email);

    if (!user) {
      showError('loginEmail', 'No account found with this email');
      return;
    }

    // Check password (in production, this would be hashed)
    if (user.password !== password) {
      showError('loginPassword', 'Incorrect password');
      return;
    }

    // Login successful
    loginUser(user);
  }

  // Handle signup
  function handleSignup(e) {
    e.preventDefault();
    clearErrors();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

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

    if (password !== passwordConfirm) {
      showError('signupPasswordConfirm', 'Passwords do not match');
      return;
    }

    // Check if user already exists
    const users = getUsersFromStorage();
    if (users.find(u => u.email === email)) {
      showError('signupEmail', 'An account with this email already exists');
      return;
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In production, this would be hashed
      createdAt: new Date().toISOString()
    };

    // Save user
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Login the user
    loginUser(newUser);
  }

  // Login user (set session)
  function loginUser(user) {
    // Store session (without password)
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      loginTime: new Date().toISOString()
    };

    localStorage.setItem('currentUser', JSON.stringify(session));
    
    // Redirect to home
    window.location.href = 'index.html';
  }

  // Helper: Get users from localStorage
  function getUsersFromStorage() {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]');
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
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
    return localStorage.getItem('currentUser') !== null;
  },

  // Get current user
  getCurrentUser: function() {
    try {
      return JSON.parse(localStorage.getItem('currentUser'));
    } catch (error) {
      return null;
    }
  },

  // Logout
  logout: function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  },

  // Require login (redirect if not logged in)
  requireLogin: function() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  }
};