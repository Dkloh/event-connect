# Security Guide

## Overview

This application implements security best practices to protect user data and prevent common web vulnerabilities.

## Security Features

### 1. Input Validation
All user inputs are validated before processing:
- **Email**: RFC 5322 compliant validation
- **Password**: Minimum 6 characters required
- **Forms**: Client-side validation with security checks

### 2. Authentication
- Firebase Authentication (email/password and Google OAuth)
- Secure session management
- Automatic token refresh
- Secure logout

### 3. Data Protection
- HTTPS enforced via Firebase Hosting
- Firebase encryption at rest
- Firestore security rules prevent unauthorized access
- No sensitive data in browser localStorage

### 4. Attack Prevention
- **XSS Prevention**: Input sanitization removes malicious scripts
- **CSRF Protection**: Firebase handles token validation
- **Injection Prevention**: Firestore parameterized queries

## Security Utilities (js/security.js)

```javascript
SecurityUtils.sanitizeInput(input)     // Remove harmful scripts
SecurityUtils.validateEmail(email)     // Check email format
SecurityUtils.validatePassword(pass)   // Check password strength
SecurityUtils.escapeHTML(text)         // Escape HTML characters
```

## Firestore Security Rules

Add these rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Events accessible to authenticated users
    match /events/{eventId} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid == resource.data.createdBy;
    }
  }
}
```

## Best Practices

1. **Always use HTTPS** in production
2. **Never commit API keys** to version control
3. **Set strong password requirements** for users
4. **Validate all inputs** on both client and server
5. **Keep Firebase SDK updated** for latest security patches

## Security Headers

These are automatically configured in `firebase.json`:
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection

## Reporting Security Issues

If you find a security vulnerability, please report it privately rather than creating a public issue.

---

**Last Updated:** January 29, 2026
