# Event Scheduler Demo

A beginner-friendly event scheduling web app built as a learning and portfolio project.

This project focuses on practical web development skills: authentication, protected pages, form handling, role-based access, and Firebase integration.

## Highlights

- Email/password authentication with Firebase Auth
- Google sign-in support
- Event scheduling and basic event management flows
- Admin-only access path using Firestore `admins/{uid}` checks
- Feedback page for collecting user input
- Responsive layout for desktop and mobile

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Firebase Authentication
- Firestore
- Firebase Hosting

## Project Goals

- Learn real-world auth and data flow basics
- Practice secure frontend patterns
- Build a complete project suitable for a portfolio

## Quick Start

### 1. Prerequisites

- A Firebase project
- Python 3 (or another local static server)

### 2. Configure Firebase

1. Go to <https://console.firebase.google.com> and create a project.
2. Enable Authentication methods:
   - Email/Password
   - Google
3. Add `localhost` to authorized domains.
4. Copy your Firebase web config values.

### 3. Set app config

Create or update `js/firebase-config.js` with your values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Run locally

Use one of these:

```bash
npm start
```

or

```bash
python -m http.server 8000
```

Open: <http://localhost:8000>

## Admin Setup

To make a user an admin, create an admin marker document in Firestore:

1. Go to Firebase Console -> Firestore Database -> Data.
2. Create collection `admins` (if it does not exist).
3. Create a document with ID set to the user's Firebase Auth UID.
4. Add this field:

```json
{
  "isAdmin": true
}
```

Then sign the user out and back in.

## Deployment

If deploying with Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

Your site will be available at `your-project.web.app`.

## Project Structure

- `index.html`: Landing page
- `login.html`: Login/sign-up screen
- `schedule.html`: Scheduling flow
- `admin.html`: Admin interface
- `feedback.html`: Feedback form
- `js/`: Authentication, scheduling, security, and page logic
- `css/styles.css`: Shared styling

## Security Notes

- Validate inputs on every form
- Keep Firebase security rules strict
- Do not expose sensitive keys outside Firebase-supported public config usage
- Use role checks before loading admin features

## Troubleshooting

- Google sign-in fails:
  - Confirm `localhost` is in authorized domains
  - Hard refresh browser (`Ctrl+Shift+R`)
- Login fails:
  - Verify auth methods are enabled in Firebase
  - Check browser console for Firebase errors
- Data not saving:
  - Confirm Firestore is created
  - Verify Firestore security rules for authenticated users

## About This Build

This is my first full web app project and part of my learning journey.

I used AI assistance for scaffolding and troubleshooting while I focused on understanding architecture, authentication flows, and implementation details. All final decisions, edits, and testing were done as part of the learning process.

## Next Improvements

- Add automated tests for core flows
- Improve error messaging and empty states
- Add edit/delete event controls with stronger validation
- Add analytics and usage tracking

---

For quick setup steps, see `QUICKSTART.md`.
