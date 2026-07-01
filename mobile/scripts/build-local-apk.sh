#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$MOBILE_DIR/.." && pwd)"

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
export NODE_ENV="${NODE_ENV:-production}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-mock://local}"

if [ ! -d "$MOBILE_DIR/android" ]; then
  CI=1 npx expo prebuild --platform android
fi

(cd "$MOBILE_DIR/android" && ./gradlew assembleRelease)

mkdir -p "$ROOT_DIR/builds"
cp "$MOBILE_DIR/android/app/build/outputs/apk/release/app-release.apk" "$ROOT_DIR/builds/xnova-release.apk"
echo "APK ready: $ROOT_DIR/builds/xnova-release.apk"
