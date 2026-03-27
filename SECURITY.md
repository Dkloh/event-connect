# Security Guide

This document explains the security model used in this project and how to harden it for production.

## Security Model at a Glance

- Authentication is handled by Firebase Authentication (email/password and Google sign-in).
- Authorization is enforced with Firestore Security Rules.
- Admin access is determined by documents in the `admins` collection.
- Input validation and sanitization are performed on the client using `js/security.js`.

## Implemented Protections

### 1. Input Validation and Sanitization

The app validates user input and sanitizes text before processing.

Available utilities in `js/security.js`:

```javascript
SecurityUtils.sanitizeInput(input)
SecurityUtils.sanitizeHTML(html)
SecurityUtils.validateEmail(email)
SecurityUtils.validatePassword(password)
SecurityUtils.escapeHTML(text)
SecurityUtils.isValidString(text, min, max)
```

Notes:
- Email validation uses a practical regex, not full RFC validation.
- Password validation checks length, lowercase, uppercase, and numeric characters.

### 2. Authentication

- Firebase Auth session handling
- Email/password login and signup
- Google OAuth sign-in
- Persistent auth state via Firebase SDK

### 3. Firestore Authorization

- Users can read/write their own profile and booking data.
- Registration and event access is restricted to authenticated users.
- Admin-only behavior is enforced through the `admins/{uid}` document check in rules.

### 4. Browser and Hosting Headers

Configured in `firebase.json`:
- Content-Security-Policy (for JS/CSS responses)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer-Policy: strict-origin-when-cross-origin

## Important Clarifications

- Firebase web config values are public identifiers, not private secrets.
- Real protection comes from strict Firestore rules and Auth checks.
- Do not store sensitive secrets in frontend code.

## Production Hardening Checklist

1. Enforce least-privilege Firestore rules for each collection.
2. Restrict admin reads/writes to true admin users only.
3. Add rate limiting and abuse controls through backend functions where needed.
4. Add server-side validation for any critical workflows.
5. Rotate credentials and monitor Firebase usage/audit logs.
6. Keep Firebase SDK dependencies updated.

## Reporting Security Issues

If you discover a security issue, report it privately and avoid posting exploit details publicly.

---

Last updated: March 27, 2026
