# Installation Guide

## Prerequisites

- **Android Studio** Iguana (2023.2.1) or newer
- **JDK 17**
- **Android SDK** with:
  - Platform `android-34`
  - Build-tools `34.0.0`
  - Platform-tools
- A Firebase project (see `FIREBASE_SETUP.md`)

## Build from Android Studio

1. Clone the repository.
2. Open the project in Android Studio.
3. Replace `app/google-services.json` with the real one from your Firebase project.
4. Create or update `local.properties` with your SDK path:
   ```
   sdk.dir=/Users/you/Library/Android/sdk
   ```
5. **Build → Make Project**. Android Studio installs the Gradle dependencies automatically.
6. Connect an Android phone (API 24+) with USB debugging on, or start an emulator.
7. **Run → Run 'app'**.

## Build from the command line

```
./gradlew :app:assembleDebug     # -> app/build/outputs/apk/debug/app-debug.apk
./gradlew :app:assembleRelease   # -> app/build/outputs/apk/release/app-release.apk (unsigned)
```

To produce a signed release build, add a `signingConfig` to `app/build.gradle.kts` pointing at a keystore you own, or let Play App Signing handle signing after you upload an AAB:

```
./gradlew :app:bundleRelease     # -> app/build/outputs/bundle/release/app-release.aab
```

## Install on a device

```
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## First launch

1. Sign in with the first owner account (see `FIREBASE_SETUP.md` step 7).
2. **Settings → Users** → create any staff users (up to a total of four across owners + staff).
3. **Settings → Appearance** → optionally toggle Dark Mode.
4. **Rice** tab → add rice products with their purchase/selling prices and kg-per-sack.
5. **Gas** tab → add cylinder types (brand, size, material: iron/plastic, deposit amount).
6. Start recording transactions — all entries are saved locally first, synced to Firestore when online.

## Minimum / target SDK

- `minSdk = 24` (Android 7.0 Nougat)
- `targetSdk = 34` (Android 14)

## Permissions

- `INTERNET`, `ACCESS_NETWORK_STATE` — required for Firebase sync.

No other runtime permissions are requested.
