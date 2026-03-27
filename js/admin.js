// Admin Dashboard
(function() {
  'use strict';

  let registrations = [];
  let bookings = [];
  let filteredRegistrations = [];
  let selectedRegistrationEmail = null;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    await loadData();
    populateEventInfo();
    populateFilters();
    calculateStatistics();
    renderRegistrationsTable();
    renderTypeBreakdown();
    setupEventListeners();
  }

  // Load data from Firestore and localStorage
  async function loadData() {
    try {
      const db = firebase.firestore();
      
      // Load registrations from Firestore (this is the source of truth)
      const registrationsSnapshot = await db.collection('registrations').get();
      registrations = [];
      registrationsSnapshot.forEach(doc => {
        registrations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Load all bookings from Firestore
      const bookingsSnapshot = await db.collection('bookings').get();
      bookings = [];
      const usersWithBookings = {}; // Track users who booked
      
      bookingsSnapshot.forEach(doc => {
        const userBookings = doc.data().meetings || [];
        const userData = doc.data();
        
        // Store user info for users with bookings
        if (userBookings.length > 0) {
          usersWithBookings[userData.userEmail] = {
            userId: userData.userId,
            userName: userData.userName,
            userEmail: userData.userEmail,
            bookingCount: userBookings.length
          };
        }
        
        bookings.push(...userBookings);
      });
      
      // Merge: registrations + users with bookings (who might not be registered)
      const registrationEmails = new Set(registrations.map(r => r.email));
      
      filteredRegistrations = [...registrations];
    } catch (error) {
      console.error('Error loading data:', error);
      registrations = [];
      bookings = [];
    }
  }

  // Populate event info
  function populateEventInfo() {
    const eventNameEl = document.getElementById('eventNameAdmin');
    if (eventNameEl) {
      eventNameEl.textContent = eventConfig.eventName;
    }
  }

  // Populate filter dropdowns
  function populateFilters() {
    const typeFilter = document.getElementById('typeFilter');
    if (!typeFilter) return;

    // Clear and add "All Types" option
    typeFilter.innerHTML = '<option value="all">All Types</option>';

    // Add attendee types from config
    eventConfig.attendeeTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.value;
      option.textContent = type.label;
      typeFilter.appendChild(option);
    });
  }

  // Calculate statistics
  function calculateStatistics() {
    const totalRegs = registrations.length;
    const totalBooks = bookings.length;
    
    // Count unique users with bookings by email
    const uniqueUsersWithBookings = new Set(bookings.map(b => b.userEmail)).size;
    
    // Booking completion rate
    const completionRate = totalRegs > 0 ? Math.round((uniqueUsersWithBookings / totalRegs) * 100) : 0;
    
    // Average bookings per person
    const avgBookings = uniqueUsersWithBookings > 0 ? (totalBooks / uniqueUsersWithBookings).toFixed(1) : 0;

    document.getElementById('totalRegistrations').textContent = totalRegs;
    document.getElementById('totalBookings').textContent = totalBooks;
    document.getElementById('completionRate').textContent = completionRate + '%';
    document.getElementById('avgBookingsPerPerson').textContent = avgBookings;
    
    // Also render slot availability
    renderSlotAvailability();
  }

  // Render slot availability calendar
  function renderSlotAvailability() {
    const container = document.getElementById('slotAvailability');
    if (!container) return;

    // Generate all time slots
    const slots = generateTimeSlots();
    
    // Map bookings by time slot
    const slotBookings = {};
    bookings.forEach(booking => {
      if (!slotBookings[booking.time]) {
        slotBookings[booking.time] = [];
      }
      slotBookings[booking.time].push(booking.userName);
    });

    // Create HTML for slot availability grid
    const slotHTML = slots.map(slot => {
      const bookedNames = slotBookings[slot.time] || [];
      const isFull = bookedNames.length > 0;
      const namesDisplay = bookedNames.length > 0 ? bookedNames.join(', ') : 'Available';
      
      return `
        <div class="slot-item ${isFull ? 'slot-booked' : 'slot-available'}">
          <div class="slot-time">${slot.time}</div>
          <div class="slot-status">${namesDisplay}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="slot-grid">
        ${slotHTML}
      </div>
    `;
  }

  // Generate time slots (same logic as scheduler)
  function generateTimeSlots() {
    const slots = [];
    const duration = eventConfig.meetingDuration;
    
    // Morning: 10am - 12pm
    let currentTime = 10 * 60; // 10:00
    while (currentTime + duration <= 12 * 60) {
      slots.push({
        time: formatTimeForSlot(currentTime),
        startMinutes: currentTime,
        endMinutes: currentTime + duration
      });
      currentTime += duration;
    }
    
    // Afternoon: 1pm - 4pm
    currentTime = 13 * 60; // 1:00 PM
    while (currentTime + duration <= 16 * 60) {
      slots.push({
        time: formatTimeForSlot(currentTime),
        startMinutes: currentTime,
        endMinutes: currentTime + duration
      });
      currentTime += duration;
    }
    
    return slots;
  }

  // Format minutes to time string
  function formatTimeForSlot(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  }

  // Render registrations table
  function renderRegistrationsTable() {
    const tbody = document.getElementById('registrationsTable');
    if (!tbody) {
      console.warn('registrationsTable element not found');
      return;
    }

    if (filteredRegistrations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-table">No registrations match your filters</td></tr>';
      return;
    }

    tbody.innerHTML = filteredRegistrations.map((reg, index) => {
      // Count bookings for this specific user by email
      const bookingCount = bookings.filter(b => b.userEmail === reg.email).length;
      const hasBookings = bookingCount > 0;
      const isBookingOnly = reg.attendeeType === 'booking-only';
      
      return `
        <tr>
          <td><strong>${reg.name}</strong>${isBookingOnly ? ' <span style="font-size: 0.85rem; color: #999;">(booked only)</span>' : ''}</td>
          <td>${reg.email}</td>
          <td>${reg.company}</td>
          <td><span class="badge badge-${reg.attendeeType}">${reg.attendeeType || 'attendee'}</span></td>
          <td>
            <span class="booking-count ${hasBookings ? 'has-bookings' : ''}">
              📅 ${bookingCount}
            </span>
          </td>
          <td>${formatDate(reg.timestamp)}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-small btn-view" onclick="viewRegistration('${reg.email}')">View</button>
              <button class="btn-small btn-delete" onclick="deleteRegistration('${reg.email}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Format date
  function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore Timestamp objects
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  // Render time slot popularity chart
  // Render attendee type breakdown
  function renderTypeBreakdown() {
    const chartEl = document.getElementById('typeBreakdownChart');
    if (!chartEl) return;

    if (registrations.length === 0) {
      chartEl.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No registrations yet</p>';
      return;
    }

    // Count by type
    const typeCounts = {};
    registrations.forEach(reg => {
      typeCounts[reg.attendeeType] = (typeCounts[reg.attendeeType] || 0) + 1;
    });

    const total = registrations.length;

    chartEl.innerHTML = Object.entries(typeCounts).map(([type, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      return `
        <div class="type-card">
          <div class="type-card-count">${count}</div>
          <div class="type-card-label">${type}</div>
          <div class="type-card-percentage">${percentage}%</div>
        </div>
      `;
    }).join('');
  }

  // Apply filters
  function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const bookingFilter = document.getElementById('bookingFilter').value;

    filteredRegistrations = registrations.filter(reg => {
      // Search filter
      const matchesSearch = 
        reg.name.toLowerCase().includes(searchTerm) ||
        reg.email.toLowerCase().includes(searchTerm) ||
        reg.company.toLowerCase().includes(searchTerm);

      // Type filter
      const matchesType = typeFilter === 'all' || reg.attendeeType === typeFilter;

      // Booking filter (simplified for demo)
      let matchesBooking = true;
      if (bookingFilter === 'has-bookings') {
        matchesBooking = bookings.length > 0; // Simplified
      } else if (bookingFilter === 'no-bookings') {
        matchesBooking = bookings.length === 0; // Simplified
      }

      return matchesSearch && matchesType && matchesBooking;
    });

    renderRegistrationsTable();
  }

  // Export to CSV
  function exportToCSV() {
    if (registrations.length === 0) {
      alert('No data to export');
      return;
    }

    // CSV headers
    const headers = ['Name', 'Email', 'Company', 'Type', 'Role', 'Interests', 'Registered'];
    
    // CSV rows
    const rows = registrations.map(reg => [
      reg.name,
      reg.email,
      reg.company,
      reg.attendeeType,
      reg.role || '',
      reg.interests || '',
      formatDate(reg.timestamp)
    ]);

    // Combine
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Clear all data
  function clearAllData() {
    if (!confirm('⚠️ WARNING: This will delete ALL registrations and bookings. This cannot be undone. Are you absolutely sure?')) {
      return;
    }

    localStorage.removeItem('registrations');
    localStorage.removeItem('bookedMeetings');
    localStorage.removeItem('currentUser');

    alert('All data has been cleared.');
    location.reload();
  }

  // View registration details
  window.viewRegistration = function(email) {
    const reg = registrations.find(r => r.email === email);
    if (!reg) return;

    alert(`Registration Details:\n\nName: ${reg.name}\nEmail: ${reg.email}\nCompany: ${reg.company}\nType: ${reg.attendeeType}\nRole: ${reg.role || 'N/A'}\nInterests: ${reg.interests || 'N/A'}`);
  };

  // Delete registration
  window.deleteRegistration = function(email) {
    selectedRegistrationEmail = email;
    document.getElementById('deleteModal').style.display = 'block';
  };

  async function confirmDelete() {
    if (!selectedRegistrationEmail) return;

    try {
      const db = firebase.firestore();
      
      // Remove from Firestore registrations
      const snapshot = await db.collection('registrations')
        .where('email', '==', selectedRegistrationEmail)
        .get();
      
      snapshot.forEach(async (doc) => {
        await db.collection('registrations').doc(doc.id).delete();
      });

      // Remove from registrations array
      registrations = registrations.filter(r => r.email !== selectedRegistrationEmail);
      localStorage.setItem('registrations', JSON.stringify(registrations));

      // Also remove from currentUser if it's them
      try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser.email === selectedRegistrationEmail) {
          localStorage.removeItem('currentUser');
        }
      } catch (e) {}

      hideDeleteModal();
      await loadData();
      calculateStatistics();
      renderRegistrationsTable();
      renderTypeBreakdown();
      
    } catch (error) {
      console.error('Error deleting registration:', error);
      alert('Failed to delete registration');
    }
  }

  function hideDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    selectedRegistrationEmail = null;
  }

  // Setup event listeners
  function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const bookingFilter = document.getElementById('bookingFilter');
    const exportBtn = document.getElementById('exportCSVBtn');
    const clearBtn = document.getElementById('clearDataBtn');

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    if (typeFilter) {
      typeFilter.addEventListener('change', applyFilters);
    }

    if (bookingFilter) {
      bookingFilter.addEventListener('change', applyFilters);
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', exportToCSV);
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', clearAllData);
    }

    // Modal buttons
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const modalOverlay = document.querySelector('#deleteModal .modal-overlay');

    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', confirmDelete);
    }

    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', hideDeleteModal);
    }
  }

})();