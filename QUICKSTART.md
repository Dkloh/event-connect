# Quick Start Guide

Get your Event Scheduler running in 5 minutes!

## 1. Firebase Setup (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication → Email/Password + Google
4. Add `localhost` to authorized domains
5. Copy your Firebase config

## 2. Configure App (1 minute)

Edit `js/firebase-config.js`:

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

## 3. Run Locally (30 seconds)

```bash
python -m http.server 8000
```

Open: http://localhost:8000

## 4. Test It

1. Go to `/login.html`
2. Click "Sign Up" and create account
3. Or use Google sign-in

Done! ✅

## Setting Up Your First Admin Account

1. Create a regular account and sign in
2. Go to [Firebase Console](https://console.firebase.google.com) → Your Project
3. Navigate to **Authentication → Users**
4. Click the user you want to make admin
5. Click **Custom Claims** (scroll to bottom)
6. Add this JSON:

```json
{
  "admin": true
}
```

7. Click **Update**

The admin user will now:
- See the "Admin" link in navigation
- Access the admin dashboard
- Manage all events and registrations

**Note:** Only users with the `admin: true` custom claim can access the admin page.

## Deploy to Firebase (Optional)

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

Your site will be at: `your-project.web.app`

## Troubleshooting

**Google sign-in not working?**
- Check `localhost` is in Firebase authorized domains
- Hard refresh: Ctrl+Shift+R

**Can't login?**
- Check Firebase authentication is enabled
- Open DevTools Console (F12) for errors

---

**Need more details?** See [README.md](README.md)
