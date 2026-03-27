/**
 * Security Utilities
 * Handles input sanitization, validation, and XSS prevention
 */

(function() {
  'use strict';

  // Expose security utilities globally
  window.SecurityUtils = {
    sanitizeInput,
    sanitizeHTML,
    validateEmail,
    validatePassword,
    escapeHTML,
    isValidString
  };

  /**
   * Sanitize user input to prevent XSS attacks
   * @param {string} input - User input to sanitize
   * @returns {string} - Sanitized input
   */
  function sanitizeInput(input) {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove whitespace from beginning and end
    let sanitized = input.trim();

    // Remove potentially harmful scripts and tags
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    return sanitized;
  }

  /**
   * Sanitize HTML content
   * @param {string} html - HTML content to sanitize
   * @returns {string} - Sanitized HTML
   */
  function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  function escapeHTML(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid
   */
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {object} - Validation result with details
   */
  function validatePassword(password) {
    const result = {
      isValid: true,
      errors: []
    };

    if (password.length < 6) {
      result.isValid = false;
      result.errors.push('Password must be at least 6 characters');
    }

    if (!/[a-z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain lowercase letters');
    }

    if (!/[A-Z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain uppercase letters');
    }

    if (!/[0-9]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain numbers');
    }

    return result;
  }

  /**
   * Validate string input
   * @param {string} str - String to validate
   * @param {number} minLength - Minimum length (default: 1)
   * @param {number} maxLength - Maximum length (default: 1000)
   * @returns {boolean} - True if valid
   */
  function isValidString(str, minLength = 1, maxLength = 1000) {
    if (typeof str !== 'string') {
      return false;
    }

    const trimmed = str.trim();
    return trimmed.length >= minLength && trimmed.length <= maxLength;
  }
})();
