// Registration Form Handler
(function() {
  'use strict';

  // Wait for DOM to load
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    populateEventName();
    populateAttendeeTypes();
    autofillFromFirebase(); // Auto-fill from logged-in user
    setupEventListeners();
  }

  // Auto-fill registration form from Firebase auth user
  function autofillFromFirebase() {
    if (typeof auth === 'undefined') {
      setTimeout(autofillFromFirebase, 100);
      return;
    }

    auth.onAuthStateChanged((user) => {
      if (user) {
        // Auto-fill email and name from Firebase
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');

        if (nameInput && !nameInput.value) {
          nameInput.value = user.displayName || '';
        }

        if (emailInput && !emailInput.value) {
          emailInput.value = user.email || '';
        }
      }
    });
  }

  // Populate event name from config
  function populateEventName() {
    const eventNameEl = document.getElementById('formEventName');
    if (eventNameEl) {
      eventNameEl.textContent = eventConfig.eventName;
    }
  }

  // Populate attendee type dropdown from config
  function populateAttendeeTypes() {
    const attendeeTypeSelect = document.getElementById('attendeeType');
    if (!attendeeTypeSelect) return;

    // Clear existing options (except the first placeholder)
    attendeeTypeSelect.innerHTML = '<option value="">Select type...</option>';

    // Add options from config
    eventConfig.attendeeTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.value;
      option.textContent = type.label;
      attendeeTypeSelect.appendChild(option);
    });
  }

  // Setup event listeners
  function setupEventListeners() {
    const form = document.getElementById('registrationForm');
    const attendeeTypeSelect = document.getElementById('attendeeType');

    // Listen for attendee type changes to show conditional fields
    if (attendeeTypeSelect) {
      attendeeTypeSelect.addEventListener('change', handleAttendeeTypeChange);
    }

    // Form submission
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }
  }

  // Handle attendee type change - show/hide conditional fields
  function handleAttendeeTypeChange(e) {
    const selectedType = e.target.value;
    const conditionalContainer = document.getElementById('conditionalFields');
    
    if (!conditionalContainer) return;

    // Clear previous conditional fields
    conditionalContainer.innerHTML = '';
    conditionalContainer.classList.remove('active');

    // If a type is selected and has conditional fields
    if (selectedType && eventConfig.conditionalFields[selectedType]) {
      const fields = eventConfig.conditionalFields[selectedType];
      
      // Create header
      const header = document.createElement('div');
      header.className = 'conditional-header';
      header.innerHTML = `
        <span>Additional ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Information</span>
        <span class="conditional-badge">${selectedType}</span>
      `;
      conditionalContainer.appendChild(header);

      // Create each conditional field
      fields.forEach(field => {
        const fieldGroup = createFieldGroup(field);
        conditionalContainer.appendChild(fieldGroup);
      });

      // Show the conditional section
      conditionalContainer.classList.add('active');
    }
  }

  // Create a form field group
  function createFieldGroup(field) {
    const group = document.createElement('div');
    group.className = 'form-group';

    const label = document.createElement('label');
    label.htmlFor = field.name;
    label.className = 'form-label';
    label.innerHTML = `${field.label} <span class="required">*</span>`;

    let input;

    if (field.type === 'select' && field.options) {
      // Create select dropdown
      input = document.createElement('select');
      input.className = 'form-input';
      input.id = field.name;
      input.name = field.name;
      input.required = true;

      // Add placeholder option
      const placeholderOption = document.createElement('option');
      placeholderOption.value = '';
      placeholderOption.textContent = 'Select...';
      input.appendChild(placeholderOption);

      // Add options
      field.options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        input.appendChild(opt);
      });

    } else if (field.type === 'textarea') {
      // Create textarea
      input = document.createElement('textarea');
      input.className = 'form-input';
      input.id = field.name;
      input.name = field.name;
      input.required = true;
      input.rows = 3;

    } else {
      // Create text input (default)
      input = document.createElement('input');
      input.type = field.type || 'text';
      input.className = 'form-input';
      input.id = field.name;
      input.name = field.name;
      input.required = true;
    }

    const error = document.createElement('span');
    error.className = 'form-error';
    error.id = `${field.name}-error`;

    group.appendChild(label);
    group.appendChild(input);
    group.appendChild(error);

    return group;
  }

  // Handle form submission
  function handleFormSubmit(e) {
    e.preventDefault();

    // Clear previous errors
    clearErrors();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Collect form data
    const formData = collectFormData();

    // Save to localStorage (simulating database)
    saveRegistration(formData);

    // Show success message
    showSuccessMessage(formData);
  }

  // Validate form
  function validateForm() {
    let isValid = true;
    const form = document.getElementById('registrationForm');
    
    // Validate required fields
    const requiredInputs = form.querySelectorAll('[required]');
    
    requiredInputs.forEach(input => {
      if (!input.value.trim()) {
        showError(input.id, 'This field is required');
        isValid = false;
      }
    });

    // Validate email format
    const emailInput = document.getElementById('email');
    if (emailInput && emailInput.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
      }
    }

    return isValid;
  }

  // Show validation error
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

  // Clear all errors
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

  // Collect form data
  function collectFormData() {
    const form = document.getElementById('registrationForm');
    const formData = new FormData(form);
    const data = {
      timestamp: new Date().toISOString(),
      eventName: eventConfig.eventName
    };

    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    return data;
  }

  // Save registration to localStorage and Firestore
  async function saveRegistration(data) {
    try {
      // Get Firebase user info to link registration
      if (typeof auth === 'undefined') {
        console.error('Firebase auth not available');
        return;
      }

      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        console.error('User not logged in');
        return;
      }

      // Add Firebase UID to registration data
      data.uid = firebaseUser.uid;
      data.firebaseEmail = firebaseUser.email;

      // Get existing registrations
      let registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
      
      // Add new registration
      registrations.push(data);
      
      // Save to localStorage
      localStorage.setItem('registrations', JSON.stringify(registrations));
      
      // Also save current user for scheduling
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: data.name,
        photoURL: firebaseUser.photoURL,
        registered: true
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // Save to Firestore for admin dashboard (with UID link)
      try {
        const db = firebase.firestore();
        await db.collection('registrations').add({
          uid: firebaseUser.uid,
          name: data.name,
          email: data.email,
          firebaseEmail: firebaseUser.email, // For matching with bookings
          company: data.company || '',
          role: data.role || '',
          interests: data.interests || '',
          attendeeType: data.attendeeType || '',
          timestamp: new Date(),
          eventName: data.eventName
        });
      } catch (firestoreError) {
        console.warn('Firestore save failed (non-blocking):', firestoreError);
        // Don't block registration if Firestore fails
      }
    } catch (error) {
      console.error('Error saving registration:', error);
    }
  }

  // Show success message
  function showSuccessMessage(data) {
    const form = document.getElementById('registrationForm');
    const successMessage = document.getElementById('successMessage');
    const registrantName = document.getElementById('registrantName');

    if (form) {
      form.style.display = 'none';
    }

    if (registrantName) {
      registrantName.textContent = data.name;
    }

    if (successMessage) {
      successMessage.style.display = 'block';
    }

    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

})();