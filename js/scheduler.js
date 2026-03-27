// Meeting Scheduler
(function() {
  'use strict';

  // State management
  let currentUser = null;
  let timeSlots = [];
  let bookedMeetings = [];
  let selectedSlot = null;

  // Initialize
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    // Wait for Firebase auth to be ready
    await waitForAuth();
    
    // Check registration (now async)
    const isRegistered = await checkUserRegistration();
    if (!isRegistered) return; // Stop if user not registered
    
    await loadBookedMeetings();
    generateTimeSlots();
    populateEventInfo();
    updateBookingStats();
    await renderTimeSlots();
    updateBookingsList();
    setupEventListeners();
  }

  // Wait for Firebase auth to initialize
  async function waitForAuth() {
    return new Promise((resolve) => {
      if (typeof auth === 'undefined') {
        const checkAuth = setInterval(() => {
          if (typeof auth !== 'undefined') {
            clearInterval(checkAuth);
            // Wait for auth state to be ready
            auth.onAuthStateChanged(() => {
              resolve();
            });
          }
        }, 100);
      } else {
        auth.onAuthStateChanged(() => {
          resolve();
        });
      }
    });
  }

  // Check if user is registered (now checks Firebase auth + Firestore registration)
  async function checkUserRegistration() {
    try {
      if (typeof auth === 'undefined') {
        showNotRegisteredMessage(false); // Not logged in
        return false;
      }

      // Check if user is logged in
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        // User not logged in
        showNotRegisteredMessage(false); // Not logged in
        return false;
      }

      // Check if user is registered

      // Check if user has registered in Firestore
      try {
        const db = firebase.firestore();
        const registrationsSnapshot = await db.collection('registrations')
          .where('firebaseEmail', '==', firebaseUser.email)
          .get();

        if (registrationsSnapshot.empty) {
          // User logged in but NOT registered
          showNotRegisteredMessage(true); // Logged in, show register button
          return false;
        }

        // User IS registered - get their info
        const registrationDoc = registrationsSnapshot.docs[0];
        const registrationData = registrationDoc.data();

        currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: registrationData.name || firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          registered: true
        };

        // Update localStorage for reference
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // User is registered - show scheduler
        document.getElementById('notRegistered').style.display = 'none';
        document.getElementById('schedulerInterface').style.display = 'block';
        
        // Display user name
        const userNameEl = document.getElementById('welcomeUserName');
        if (userNameEl) {
          userNameEl.textContent = currentUser.name;
        }
        
        return true;

      } catch (firestoreError) {
        console.error('Error checking Firestore registration:', firestoreError);
        showNotRegisteredMessage(true); // Logged in, show register button
        return false;
      }
    } catch (error) {
      console.error('Error checking registration:', error);
      showNotRegisteredMessage(false); // Not logged in
      return false;
    }
  }

  // Show appropriate message based on login status
  function showNotRegisteredMessage(isLoggedIn) {
    document.getElementById('notRegistered').style.display = 'block';
    document.getElementById('schedulerInterface').style.display = 'none';

    const message = document.getElementById('regMessage');
    const actionBtn = document.getElementById('regActionBtn');
    const altBtn = document.getElementById('regAltBtn');

    if (isLoggedIn) {
      // User logged in, show register message
      message.textContent = 'Complete your registration to book meetings.';
      actionBtn.href = 'register.html';
      actionBtn.textContent = 'Register Now';
      actionBtn.style.display = 'inline-block';
      altBtn.style.display = 'none';
    } else {
      // User not logged in, show login message
      message.textContent = 'You need to log in first, then register for the event.';
      actionBtn.href = 'login.html';
      actionBtn.textContent = 'Login / Sign Up';
      actionBtn.style.display = 'inline-block';
      altBtn.style.display = 'none';
    }
  }

  // Load existing bookings from Firestore
  async function loadBookedMeetings() {
    try {
      const userData = localStorage.getItem('currentUser');
      if (!userData) {
        bookedMeetings = [];
        return;
      }
      
      const user = JSON.parse(userData);
      const db = firebase.firestore();
      const docRef = db.collection('bookings').doc(user.uid);
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        bookedMeetings = docSnap.data().meetings || [];
      } else {
        bookedMeetings = [];
      }
    } catch (error) {
      console.error('Error loading bookings from Firestore:', error);
      bookedMeetings = [];
    }
  }

  // Get all bookings from all users (for slot availability)
  async function getAllBookings() {
    try {
      const db = firebase.firestore();
      const snapshot = await db.collection('bookings').get();
      const allBookings = [];
      
      snapshot.forEach(doc => {
        const meetings = doc.data().meetings || [];
        allBookings.push(...meetings);
      });
      
      return allBookings;
    } catch (error) {
      console.error('Error getting all bookings:', error);
      return [];
    }
  }

  // Save bookings to Firestore
  async function saveBookedMeetings() {
    try {
      const userData = localStorage.getItem('currentUser');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const db = firebase.firestore();
      
      await db.collection('bookings').doc(user.uid).set({
        userId: user.uid,
        userEmail: user.email,
        userName: user.name,
        meetings: bookedMeetings,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving bookings to Firestore:', error);
    }
  }

// Generate time slots based on config
function generateTimeSlots() {
  timeSlots = [];
  
  try {
    const duration = eventConfig.meetingDuration;
    const buffer = eventConfig.bufferBetweenMeetings || 0;
    
    // Meeting window 1: 10:00 AM - 12:00 PM
    const window1Start = parseTime("10:00");
    const window1End = parseTime("12:00");
    
    // Meeting window 2: 1:00 PM - 4:00 PM
    const window2Start = parseTime("13:00");
    const window2End = parseTime("16:00");
    
    // Generate slots for window 1
    let currentTime = window1Start;
    while (currentTime + duration <= window1End) {
      const slotTime = formatTime(currentTime);
      timeSlots.push({
        time: slotTime,
        startMinutes: currentTime,
        endMinutes: currentTime + duration,
        available: true,
        booked: false
      });
      currentTime += duration + buffer;
    }
    
    // Generate slots for window 2
    currentTime = window2Start;
    while (currentTime + duration <= window2End) {
      const slotTime = formatTime(currentTime);
      timeSlots.push({
        time: slotTime,
        startMinutes: currentTime,
        endMinutes: currentTime + duration,
        available: true,
        booked: false
      });
      currentTime += duration + buffer;
    }
    
  } catch (error) {
    console.error('Error generating time slots:', error);
  }
}

  // Parse time string (HH:MM) to minutes
  function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Format minutes to time string (HH:MM AM/PM)
  function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  }

  // Populate event info
  function populateEventInfo() {
    const eventNameEl = document.getElementById('schedulerEventName');
    const durationEl = document.getElementById('meetingDuration');
    
    if (eventNameEl) {
      eventNameEl.textContent = eventConfig.eventName;
    }
    
    if (durationEl) {
      durationEl.textContent = eventConfig.meetingDuration;
    }
  }

  // Render time slots (now async to handle Firestore calls)
  async function renderTimeSlots() {
    const grid = document.getElementById('timeSlotsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    
    // Load all bookings once before rendering slots
    const allBookings = await getAllBookings();

    timeSlots.forEach((slot, index) => {
      const slotEl = createTimeSlotElement(slot, index, allBookings);
      grid.appendChild(slotEl);
    });
  }

  // Create time slot element (now with allBookings passed in)
  function createTimeSlotElement(slot, index, allBookings) {
    const div = document.createElement('div');
    div.className = 'time-slot';
    
    // Check if this slot is booked by current user
    const isUserBooked = bookedMeetings.some(booking => booking.time === slot.time);
    
    // Check if slot is booked by ANY user (to prevent double-booking)
    const isSlotTaken = allBookings.some(booking => booking.time === slot.time);
    
    // Check if user has reached max bookings
    const hasReachedMax = bookedMeetings.length >= eventConfig.maxMeetingsPerUser;
    
    // Determine slot status
    if (isUserBooked) {
      div.classList.add('booked');
    } else if (isSlotTaken) {
      div.classList.add('unavailable');
    } else if (hasReachedMax) {
      div.classList.add('unavailable');
    } else {
      div.classList.add('available');
    }
    
    div.innerHTML = `
      <span class="time-slot-time">${slot.time}</span>
      <span class="time-slot-status">
        ${isUserBooked ? 'Booked' : (isSlotTaken ? 'Taken' : (hasReachedMax ? 'Max Reached' : 'Available'))}
      </span>
    `;
    
    // Add click handler for available slots
    if (!isUserBooked && !isSlotTaken && !hasReachedMax) {
      div.addEventListener('click', () => handleSlotClick(slot));
    }
    
    return div;
  }

  // Handle time slot click
  function handleSlotClick(slot) {
    selectedSlot = slot;
    showBookingModal(slot);
  }

  // Show booking confirmation modal
  function showBookingModal(slot) {
    const modal = document.getElementById('bookingModal');
    const timeEl = document.getElementById('modalTime');
    const durationEl = document.getElementById('modalDuration');
    
    if (timeEl) {
      timeEl.textContent = slot.time;
    }
    
    if (durationEl) {
      durationEl.textContent = `${eventConfig.meetingDuration} minutes`;
    }
    
    if (modal) {
      modal.style.display = 'block';
    }
  }

  // Hide booking modal
  function hideBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
      modal.style.display = 'none';
    }
    selectedSlot = null;
  }

  // Confirm booking (now async to save to Firestore)
  async function confirmBooking() {
    if (!selectedSlot || !currentUser) return;

    // Create booking object with user info
    const booking = {
      id: Date.now(),
      userId: currentUser.uid,
      userName: currentUser.name,
      userEmail: currentUser.email,
      time: selectedSlot.time,
      duration: eventConfig.meetingDuration,
      timestamp: new Date().toISOString()
    };

    // Add to bookings
    bookedMeetings.push(booking);
    
    // Save to Firestore
    await saveBookedMeetings();
    
    // Update UI
    await renderTimeSlots();
    updateBookingsList();
    updateBookingStats();
    
    // Hide modal
    hideBookingModal();
  }

  // Remove booking (now async to save to Firestore)
  async function removeBooking(bookingId) {
    // Remove from array
    bookedMeetings = bookedMeetings.filter(b => b.id !== bookingId);
    
    // Save to Firestore
    await saveBookedMeetings();
    
    // Update UI
    await renderTimeSlots();
    updateBookingsList();
    updateBookingStats();
  }

  // Update bookings list in sidebar
  function updateBookingsList() {
    const listEl = document.getElementById('bookingsList');
    const emptyEl = document.getElementById('noBookings');
    const clearBtn = document.getElementById('clearAllBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (!listEl) return;

    if (bookedMeetings.length === 0) {
      // Show empty state
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      if (clearBtn) clearBtn.style.display = 'none';
      if (exportBtn) exportBtn.style.display = 'none';
      return;
    }

    // Hide empty state
    if (emptyEl) emptyEl.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'block';
    if (exportBtn) exportBtn.style.display = 'block';

    // Sort bookings by time
    const sortedBookings = [...bookedMeetings].sort((a, b) => {
      return parseTime(a.time.split(' ')[0]) - parseTime(b.time.split(' ')[0]);
    });

    // Render bookings
    listEl.innerHTML = sortedBookings.map(booking => `
      <div class="booking-card">
        <div class="booking-time">${booking.time}</div>
        <div class="booking-duration">${booking.duration} minutes</div>
        <button class="booking-remove" data-id="${booking.id}" title="Remove booking">×</button>
      </div>
    `).join('');

    // Add remove handlers
    listEl.querySelectorAll('.booking-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        if (confirm('Remove this booking?')) {
          removeBooking(id);
        }
      });
    });
  }

  // Update booking statistics
  function updateBookingStats() {
    const bookedCountEl = document.getElementById('bookedCount');
    const remainingCountEl = document.getElementById('remainingCount');
    
    const booked = bookedMeetings.length;
    const remaining = Math.max(0, eventConfig.maxMeetingsPerUser - booked);
    
    if (bookedCountEl) {
      bookedCountEl.textContent = booked;
    }
    
    if (remainingCountEl) {
      remainingCountEl.textContent = remaining;
    }
  }

  // Clear all bookings (now async)
  async function clearAllBookings() {
    if (!confirm('Are you sure you want to clear all bookings?')) {
      return;
    }

    bookedMeetings = [];
    await saveBookedMeetings();
    await renderTimeSlots();
    updateBookingsList();
    updateBookingStats();
  }

  // Export schedule
  function exportSchedule() {
    if (bookedMeetings.length === 0) {
      alert('No bookings to export');
      return;
    }

    const exportData = {
      user: currentUser.name,
      email: currentUser.email,
      event: eventConfig.eventName,
      bookings: bookedMeetings
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule-${currentUser.name.replace(/\s+/g, '-')}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Setup event listeners
  function setupEventListeners() {
    // Modal buttons
    const confirmBtn = document.getElementById('confirmBookingBtn');
    const cancelBtn = document.getElementById('cancelBookingBtn');
    const overlay = document.querySelector('.modal-overlay');
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', confirmBooking);
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', hideBookingModal);
    }
    
    if (overlay) {
      overlay.addEventListener('click', hideBookingModal);
    }

    // Clear all button
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', clearAllBookings);
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportSchedule);
    }
  }

})();