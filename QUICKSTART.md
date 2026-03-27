# Quick Start

Get Event Scheduler running locally in about 5 minutes.

## 1. Create and Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com).
2. Create a new project.
3. Enable Authentication providers:
   - Email/Password
   - Google
4. Add `localhost` to authorized domains.
5. Copy your Firebase web app config values.

## 2. Add Your Firebase Config

Update `js/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 3. Start the App

Use either command:

```bash
npm start
```

or

```bash
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

## 4. Smoke Test

1. Open `/login.html`.
2. Create an account with Sign Up.
3. Sign out and sign back in.
4. Test Google sign-in.
5. Open `/schedule.html` and create a sample event.
6. Verify the event appears after refresh.

If all checks pass, your local setup is working.

## 5. Set Your First Admin User

1. Create a normal user account and sign in once.
2. In Firebase Console, open your project.
3. Go to Firestore Database -> Data.
4. Create collection `admins` (if needed).
5. Add a document where the document ID is the user's Firebase Auth UID.
6. Add this field to the document:

```json
{
  "isAdmin": true
}
```

7. Save changes and sign the user out/in again.

Admin users can access `/admin.html` and admin-only controls.

## Optional: Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

Site URL format: `your-project.web.app`

## Troubleshooting

Google sign-in fails:
- Confirm `localhost` is in Firebase authorized domains.
- Hard refresh the browser with `Ctrl+Shift+R`.

Login fails:
- Verify auth providers are enabled in Firebase.
- Check browser console errors.

Events do not save:
- Confirm Firestore database is created.
- Check Firestore rules for authenticated read/write.

---

For full setup details and project notes, see [README.md](README.md).
