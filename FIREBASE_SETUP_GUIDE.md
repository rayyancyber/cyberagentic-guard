# 🔥 Firebase Setup Guide - Email & Google Authentication

## ✅ Your Firebase Configuration

Your app is now configured with the new Firebase project:

```javascript
Project ID: cyberguard-6d718
Auth Domain: cyberguard-6d718.firebaseapp.com
```

---

## 🔧 Required Firebase Console Setup

### Step 1: Enable Authentication Methods

1. **Go to Firebase Console**:
   👉 https://console.firebase.google.com/project/cyberguard-6d718/authentication

2. **Enable Email/Password Authentication**:
   - Click on **"Authentication"** in left sidebar
   - Click **"Get Started"** (if first time)
   - Go to **"Sign-in method"** tab
   - Click **"Email/Password"**
   - Toggle **"Enable"** to ON
   - Click **"Save"**

3. **Enable Google Authentication**:
   - Still in **"Sign-in method"** tab
   - Click **"Google"**
   - Toggle **"Enable"** to ON
   - Enter **Project public-facing name**: `CYBERGUARD X`
   - Enter **Support email**: Your email
   - Click **"Save"**

---

## 🌐 Step 2: Configure Authorized Domains

1. In **Authentication → Settings → Authorized domains**

2. Add these domains:
   - ✅ `localhost` (should already be there)
   - ✅ `cyberguard-6d718.firebaseapp.com` (should already be there)
   - ➕ Add your production domain when deployed

---

## 🔑 Step 3: OAuth Consent Screen (Google Login)

For Google login to work, configure the OAuth consent screen:

1. **Go to Google Cloud Console**:
   👉 https://console.cloud.google.com/apis/credentials/consent?project=cyberguard-6d718

2. **Configure OAuth Consent Screen**:
   - User Type: **External**
   - App name: `CYBERGUARD X`
   - User support email: Your email
   - Developer contact: Your email
   - Click **"Save and Continue"**

3. **Add Scopes** (if prompted):
   - Add: `email`
   - Add: `profile`
   - Click **"Save and Continue"**

4. **Add Test Users** (for development):
   - Add your email address
   - Add any other test users
   - Click **"Save and Continue"**

---

## 🔒 Step 4: Configure CORS and Security

### Authorized JavaScript Origins:

1. Go to: https://console.cloud.google.com/apis/credentials?project=cyberguard-6d718

2. Click on **Web client (auto created by Google Service)**

3. Under **"Authorized JavaScript origins"**, add:
   ```
   http://localhost:8080
   http://localhost:3000
   http://127.0.0.1:8080
   ```

4. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:8080/__/auth/handler
   http://localhost:3000/__/auth/handler
   https://cyberguard-6d718.firebaseapp.com/__/auth/handler
   ```

5. Click **"Save"**

---

## ✅ Step 5: Test Authentication

### Test Email/Password:

1. Open: http://localhost:8080/auth
2. Click **"Sign Up"**
3. Enter email and password
4. Click **"Create Account"**
5. Should work without errors! ✅

### Test Google Login:

1. Open: http://localhost:8080/auth
2. Click **"Continue with Google"**
3. Select your Google account
4. Should sign in successfully! ✅

---

## 🔄 Sync with Supabase

Your app automatically syncs Firebase auth with Supabase:

1. User signs in with Firebase (Google or Email)
2. App gets Firebase ID token
3. `bridgeGoogle()` or `bridgeEmail()` creates Supabase session
4. User can now access database with RLS policies

---

## 📝 Quick Setup Checklist

```
Firebase Console (https://console.firebase.google.com/project/cyberguard-6d718):
□ Enable Email/Password authentication
□ Enable Google authentication
□ Configure OAuth consent screen
□ Add authorized domains
□ Add test users (for Google login)

Google Cloud Console (https://console.cloud.google.com/apis/credentials?project=cyberguard-6d718):
□ Configure OAuth consent screen
□ Add authorized JavaScript origins
□ Add authorized redirect URIs
□ Publish app (or keep in testing mode)
```

---

## 🐛 Troubleshooting

### "Firebase: Error (auth/operation-not-allowed)"
**Fix**: Enable Email/Password in Firebase Console → Authentication → Sign-in method

### "Firebase: Error (auth/unauthorized-domain)"
**Fix**: Add your domain to Firebase Console → Authentication → Settings → Authorized domains

### "popup_closed_by_user"
**Fix**: User closed Google popup. Normal behavior, no fix needed.

### "auth/popup-blocked"
**Fix**: Browser blocked popup. Tell user to allow popups for your domain.

### Google Login shows "Error 400: redirect_uri_mismatch"
**Fix**: Add the redirect URI to Google Cloud Console OAuth credentials

### "This app hasn't been verified by Google"
**Fix**: In testing mode, click "Advanced" → "Go to CYBERGUARD X (unsafe)". For production, submit for Google verification.

---

## 🎯 Testing Guide

After setup, test this flow:

1. **Email Signup**:
   ```
   http://localhost:8080/auth → Sign Up → Enter credentials → Should work ✅
   ```

2. **Email Login**:
   ```
   Sign out → Sign In → Use same credentials → Should work ✅
   ```

3. **Google Login**:
   ```
   Click "Continue with Google" → Select account → Should work ✅
   ```

4. **Password Reset**:
   ```
   Click "Forgot Password" → Enter email → Should receive reset email ✅
   ```

5. **Create Task** (Test Session):
   ```
   After login → Go to /team → Create task → Should work without "Session expired" ✅
   ```

---

## 📚 Additional Resources

- **Firebase Auth Docs**: https://firebase.google.com/docs/auth
- **Google OAuth Setup**: https://developers.google.com/identity/protocols/oauth2
- **Firebase Console**: https://console.firebase.google.com/project/cyberguard-6d718
- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials?project=cyberguard-6d718

---

## 🔐 Security Notes

- ✅ Firebase API keys are safe to expose in client code
- ✅ Security comes from Firebase Authentication + Supabase RLS
- ✅ Never commit `.env` files with sensitive Supabase keys
- ✅ Use authorized domains to restrict where auth can be used

---

**Your Firebase authentication is ready!** Follow the checklist above to complete setup in Firebase Console. 🚀
