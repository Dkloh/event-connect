# Event Scheduler

A professional event scheduling web application with secure authentication and responsive design.

## Features

- **User Authentication**: Email/password and Google OAuth sign-in
- **Event Management**: Create, view, and manage events
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Secure**: Input validation and Firebase security
- **User Feedback**: Built-in feedback form

## Quick Start

1. **Setup Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Email/Password and Google authentication
   - Add `localhost` to authorized domains

2. **Configure**
   - Update `js/firebase-config.js` with your Firebase credentials

3. **Run Locally**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Or any local server
   npm start
   ```

4. **Open in browser**
   - Visit `http://localhost:8000`

## Firebase Setup

1. **Create Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project

2. **Enable Authentication**
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google

3. **Get Config**
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy the config values

4. **Update Config File**
   Edit `js/firebase-config.js`:
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

5. **Add Authorized Domain**
   - Authentication → Settings → Authorized domains
   - Add `localhost` for local development

## Authentication

### Google OAuth Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Deployment to Firebase

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login**
   ```bash
   firebase login
   ```

3. **Initialize**
   ```bash
   firebase init
   ```
   - Select Hosting
   - Choose your project
   - Set public directory to `.` (current folder)

4. **Deploy**
   ```bash
   firebase deploy
   ```

Your site will be live at `your-project.web.app`

## Security Features

- Input validation on all forms
- XSS attack prevention
- Secure Firebase authentication
- Password strength requirements
- Email validation

## Pages

- `index.html` - Home/landing page
- `login.html` - Login and signup
- `schedule.html` - Event management
- `admin.html` - Admin dashboard
- `feedback.html` - User feedback formCLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase:
   ```bash
   firebase init
   ```

3. Deploy:
   ```bash
   Troubleshooting

**Google OAuth not working?**
- Make sure `localhost` is in Firebase authorized domains
- Hard refresh browser (Ctrl+Shift+R)

**Can't login?**
- Check Firebase authentication is enabled
- Check browser console for errors

**Events not saving?**
- Ensure Firestore database is created in Firebase
- Check security rules allow authenticated users

## Customization

- **Colors**: Edit CSS variables in `css/styles.css`
- **Branding**: Update logo and text in HTML files
- **Features**: Modify JavaScript files in `js/` folder

## Tech Stack

- HTML5, CSS3, JavaScript
- Firebase (Auth, Firestore, Hosting)
- No framework required

---

**Version:** 1.0
**Last Updated:**