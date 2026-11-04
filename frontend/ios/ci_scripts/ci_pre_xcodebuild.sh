#!/bin/sh
# Runs before xcodebuild archive. Installs CocoaPods and bumps the iOS build number.
set -e

. "$(dirname "$0")/ci_environment.sh"

REPO_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$(dirname "$0")/../.." && pwd)}"
IOS_DIR="$REPO_ROOT/ios"
PLIST="$IOS_DIR/MyTDP/Info.plist"

cd "$IOS_DIR"

echo "=== Xcode Cloud: ci_pre_xcodebuild ==="
echo "NODE_BINARY=$NODE_BINARY"

if [ ! -d "$REPO_ROOT/node_modules/react-native" ]; then
  echo "error: node_modules missing — ci_post_clone must run successfully first"
  exit 1
fi

# --- Build number (must increase for every App Store / TestFlight upload) ---
COMMITTED_BUILD=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "$PLIST")
CLOUD_BUILD="${CI_BUILD_NUMBER:-1}"
NEW_BUILD=$((COMMITTED_BUILD + CLOUD_BUILD))

echo "Build number: committed=$COMMITTED_BUILD cloud=$CLOUD_BUILD -> $NEW_BUILD"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD" "$PLIST"

PBXPROJ="$IOS_DIR/MyTDP.xcodeproj/project.pbxproj"
if [ -f "$PBXPROJ" ]; then
  sed -i '' "s/CURRENT_PROJECT_VERSION = [^;]*;/CURRENT_PROJECT_VERSION = $NEW_BUILD;/g" "$PBXPROJ"
fi

# --- CocoaPods ---
# use_native_modules! (Expo autolinking) reads node_modules and links any new native deps.
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

bundle config set --local path 'vendor/bundle'
bundle install --jobs 4 --retry 3
bundle exec pod install --repo-update

if [ ! -d Pods ]; then
  echo "error: pod install did not create Pods/"
  exit 1
fi

echo "=== ci_pre_xcodebuild complete (build $NEW_BUILD) ==="
