# Mobile Publishing

The GitHub Pages deployment is the mobile web build. Native publishing needs Android and iOS binaries built from the Expo app in `mobile/`.

## Current Native Setup

- App display name: `Xnova`
- Android package: `com.xnova.novasocialai`
- iOS bundle identifier: `com.xnova.novasocialai`
- Production build profile: `mobile/eas.json`
- App assets: `mobile/assets/icon.png`, `mobile/assets/adaptive-icon.png`, `mobile/assets/splash.png`
- Demo API mode: `EXPO_PUBLIC_API_URL=mock://local`

`mock://local` makes the app usable without a hosted backend. Before a real store launch with shared user data, replace it with your production API URL, for example:

```bash
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

## Build Commands

Run these from the repository root:

```bash
npm run mobile:eas:login
npm --workspace mobile run eas:configure
npm run mobile:build:android:preview
npm run mobile:build:android
npm run mobile:build:ios
```

Use `mobile:build:android:preview` first. It creates an APK you can install on Android phones for testing before uploading an app bundle to Google Play.

## Submit Commands

```bash
npm run mobile:submit:android
npm run mobile:submit:ios
```

## Store Account Requirements

- Google Play requires a Google Play Developer account before publishing Android apps.
- Apple App Store publishing requires Apple Developer Program membership.
- EAS Submit can upload Android and iOS binaries from the command line after those store accounts are configured.

Official references:

- Expo EAS Build: https://docs.expo.dev/build/introduction/
- Expo EAS Submit: https://docs.expo.dev/submit/introduction/
- Expo monorepo builds: https://docs.expo.dev/build-reference/build-with-monorepos/
- Google Play Console signup: https://support.google.com/googleplay/android-developer/answer/6112435
- Apple Developer Program: https://developer.apple.com/programs/

## Store Checklist

- Create the app in Google Play Console and App Store Connect.
- Confirm the package/bundle identifier exactly matches `com.xnova.novasocialai`.
- Upload the Android `.aab` and iOS build.
- Add app name, short description, full description, category, screenshots, privacy policy URL, support email, content rating, and data safety/privacy answers.
- Test Android through internal testing and iOS through TestFlight before production release.
