/**
 * Feedback Handler
 * Manages user feedback submission and validation
 */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const feedbackForm = document.getElementById('feedbackForm');
    const messageField = document.getElementById('feedbackMessage');
    const charCount = document.getElementById('charCount');

    if (feedbackForm) {
      feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    }

    if (messageField && charCount) {
      messageField.addEventListener('input', function() {
        charCount.textContent = this.value.length;
      });
    }
  }

  /**
   * Handle feedback form submission
   */
  async function handleFeedbackSubmit(e) {
    e.preventDefault();

    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Clear previous messages
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';

    try {
      // Validate form
      const feedbackData = validateFeedback();

      // In a production app, you would send this to a backend service
      // await sendFeedbackToServer(feedbackData);

      // Show success message
      successMessage.style.display = 'block';
      successMessage.scrollIntoView({ behavior: 'smooth' });

      // Reset form
      e.target.reset();
      document.getElementById('charCount').textContent = '0';

      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Feedback';

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 5000);

    } catch (error) {
      console.error('Feedback submission error:', error);
      errorMessage.textContent = error.message || 'An error occurred. Please try again.';
      errorMessage.style.display = 'block';
      errorMessage.scrollIntoView({ behavior: 'smooth' });
      submitBtn.disabled = false;
    }
  }

  /**
   * Validate feedback data
   */
  function validateFeedback() {
    const name = sanitize(document.getElementById('feedbackName').value);
    const email = document.getElementById('feedbackEmail').value.trim();
    const category = document.getElementById('feedbackCategory').value;
    const message = sanitize(document.getElementById('feedbackMessage').value);

    // Validate category
    if (!category) {
      throw new Error('Please select a feedback category.');
    }

    // Validate message
    if (!SecurityUtils.isValidString(message, 10, 2000)) {
      throw new Error('Please provide feedback between 10 and 2000 characters.');
    }

    // Validate email if provided
    if (email && !SecurityUtils.validateEmail(email)) {
      throw new Error('Please enter a valid email address.');
    }

    return {
      name: name || 'Anonymous',
      email: email || 'not-provided',
      category,
      message,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
  }

  /**
   * Sanitize user input
   */
  function sanitize(input) {
    return SecurityUtils.sanitizeInput(input);
  }

  /**
   * Send feedback to backend service
   * Replace with your actual backend endpoint
   */
  async function sendFeedbackToServer(feedbackData) {
    // Example: Send to a webhook or backend API
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData)
    });

    if (!response.ok) {
      throw new Error('Failed to submit feedback. Please try again later.');
    }

    return response.json();
  }
})();
