# Firebase Setup

OneDesk Business V2 ships with a **placeholder** `app/google-services.json`. Replace it with a real one before building for production.

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com/>.
2. Click **Add project** → name it (e.g. `OneDesk Business V2 - Dubai Gas & Rice`).
3. Disable Google Analytics unless you need it (not required by the app).

## 2. Register the Android app

Register **two** package names so both the release and debug builds work:

| Package name                     | Build                     |
|----------------------------------|---------------------------|
| `com.fixibleit.onedesk`          | Release                   |
| `com.fixibleit.onedesk.debug`    | Debug                     |

For the **SHA-1 fingerprint** (only needed if you enable Google sign-in later; not required for email/password):

```
cd android/app
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## 3. Download the config

Firebase will offer `google-services.json` once both apps are registered. Place it at:

```
app/google-services.json
```

Overwriting the existing placeholder. Do NOT commit the real file to a public repository.

## 4. Enable Authentication

Firebase Console → **Authentication** → **Sign-in method** → enable **Email/Password**.

## 5. Enable Firestore

Firebase Console → **Firestore Database** → **Create database** → **Production mode** → nearest region (Mumbai `asia-south1` is a good default for Bangladesh).

## 6. Apply security rules

Copy the contents of [`firestore.rules`](./firestore.rules) into Firestore Console → **Rules** → **Publish**.

## 7. Create the first owner account

The app's login screen signs in only; user creation is from Settings → Users (owner-only). Bootstrap the first owner by:

1. In the Firebase Console → Authentication → Add user → create one with a real email + strong password.
2. Launch the app and sign in with those credentials. On first launch the user is cached locally as **STAFF** by default — use the Firestore console to flip their `users/{uid}.role` document field to `OWNER` if you want a specific user to be the first owner. Any subsequent user creation is done through the in-app flow.

## 8. (Optional) App Check

For production, enable Firebase App Check with Play Integrity. This is not configured out of the box.
