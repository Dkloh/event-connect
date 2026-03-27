# Firestore Security Rules

Use this ruleset in Firebase Console under Firestore Database -> Rules.

It matches the current app architecture:
- Admin users are identified by a document at `admins/{uid}`.
- Regular users can access only their own profile/booking/registration data.
- Admin users can read all relevant collections for the admin dashboard.

## How to Apply

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Go to Firestore Database -> Rules.
4. Replace existing rules with the rules below.
5. Click Publish.

## Recommended Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Admin marker documents. Client-side writes are blocked.
    match /admins/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if false;
    }

    // User profiles
    match /users/{userId} {
      allow read, write: if isOwner(userId) || isAdmin();
    }

    // Events: authenticated users can read/create, admins can update/delete.
    match /events/{eventId} {
      allow read, create: if isSignedIn();
      allow update, delete: if isAdmin();
    }

    // Bookings keyed by uid (bookings/{uid})
    match /bookings/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create, update: if isOwner(userId)
        && request.resource.data.userId == request.auth.uid;
      allow delete: if isOwner(userId) || isAdmin();
    }

    // Registrations
    match /registrations/{registrationId} {
      allow create: if isSignedIn()
        && request.resource.data.uid == request.auth.uid;
      allow read: if isSignedIn()
        && (resource.data.uid == request.auth.uid || isAdmin());
      allow update, delete: if isSignedIn()
        && (resource.data.uid == request.auth.uid || isAdmin());
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Create Your First Admin

Because client writes to `admins` are blocked by rules, add admins manually in Firebase Console:

1. Go to Firestore Database -> Data.
2. Create collection: `admins`.
3. Create document ID equal to the user's Firebase Auth UID.
4. Add field:

```json
{
  "isAdmin": true
}
```

After the user signs out and signs in again, admin-aware pages/features can load with the new access.

## Data Shape Reference

Expected collections:
- `users/{uid}`: profile data
- `bookings/{uid}`: meetings array and user metadata
- `registrations/{docId}`: registration entries including `uid`
- `admins/{uid}`: admin marker document

## Validation Tips

- Test with one normal user and one admin user.
- Confirm normal users cannot read other users' bookings.
- Confirm admin dashboard reads registrations/bookings successfully.
- Use the Firestore Rules Playground to test allow/deny behavior before publishing.

---

Last updated: March 27, 2026
