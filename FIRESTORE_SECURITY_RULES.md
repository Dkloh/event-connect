# Firestore Security Rules

Copy these rules into your Firebase Console under **Firestore Database > Rules**.

## Setup Instructions:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **event-scheduler-demo**
3. Go to **Firestore Database** > **Rules** tab
4. Replace all existing rules with the code below
5. Click **Publish**

## Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admins collection - authenticated users can read, only admins can write
    match /admins/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId && request.auth.token.admin == true;
    }
    
    // Users collection - authenticated users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Events collection - authenticated users can read and create, only admins can update/delete
    match /events/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.token.admin == true;
    }
    
    // Bookings collection - all users can read all bookings, but only write/delete their own
    match /bookings/{userId} {
      allow read: if request.auth != null;  // Any authenticated user can read ALL bookings
      allow create: if request.auth.uid == userId && 
                       request.resource.data.userId == request.auth.uid;
      allow update: if request.auth.uid == userId && 
                       request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth.uid == userId;
      // Admins can also read all bookings
      allow read: if request.auth.token.admin == true;
    }
    
    // Registrations collection - authenticated users can read and write
    match /registrations/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Deny everything else by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## What This Does:

1. **`/users/{userId}`** - User profiles
   - Users can only read/write their own profile
   - Created automatically on signup via firebase-auth.js

2. **`/bookings/{userId}`** - Meeting bookings
   - Each user's bookings are stored under their UID as the document ID
   - Users can only read/write their own bookings
   - This prevents anyone from seeing or modifying other users' bookings

3. **`/registrations`** - Event registration data
   - All authenticated users can read and write
   - For the registration form

4. **`/admins`** - Admin flags
   - Authenticated users can read (to check if they're admin)
   - Write is disabled (you set admin status manually in Firebase Console)

## Setting Someone as Admin:

1. Go to Firebase Console > Firestore > Collections
2. Create or go to the `admins` collection
3. Add a document with the user's UID as the ID
4. Add a field: `isAdmin: true`

Example:
```
Document ID: abc123def456...
Field: isAdmin
Value: true (boolean)
```

## Collection Structure After Migration:

```
firestore
├── users/
│   └── {userId}
│       ├── uid: string
│       ├── name: string
│       ├── email: string
│       ├── photoURL: string (nullable)
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── bookings/
│   └── {userId}
│       ├── userId: string
│       ├── userEmail: string
│       ├── userName: string
│       ├── meetings: array
│       │   └── [0]
│       │       ├── id: number
│       │       ├── time: string (e.g., "10:00 AM")
│       │       ├── duration: number (minutes)
│       │       └── timestamp: string (ISO format)
│       └── updatedAt: timestamp
│
├── registrations/
│   └── {docId}
│       ├── name: string
│       ├── email: string
│       ├── company: string
│       ├── role: string
│       ├── interests: string
│       ├── attendeeType: string
│       └── timestamp: string
│
└── admins/
    └── {userId}
        └── isAdmin: boolean
```

---

**After publishing these rules, your app will:**
- Store user bookings in Firestore (persistent across devices)
- Create user profiles automatically on signup
- Prevent cross-user data access
- Allow admins to view all bookings via the admin dashboard
