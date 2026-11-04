#!/bin/sh
# Runs after Xcode Cloud clones the repo.
# Installs JavaScript dependencies required by React Native / Expo build phases.
set -e

. "$(dirname "$0")/ci_environment.sh"

REPO_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$REPO_ROOT"

echo "=== Xcode Cloud: ci_post_clone ==="
echo "Repository: $REPO_ROOT"
echo "Node: $NODE_BINARY ($(node -v))"
echo "npm: $(npm -v)"

if [ ! -f package-lock.json ]; then
  echo "error: package-lock.json is missing — commit it after running npm install"
  exit 1
fi

# React Native / Expo Xcode script phases read NODE_BINARY from this file.
echo "export NODE_BINARY=$NODE_BINARY" > ios/.xcode.env.local

# Installs exact versions from package-lock.json.
# postinstall runs patch-package (patches/ must be committed).
# Fails fast if package.json and package-lock.json are out of sync.
if ! npm ci; then
  echo ""
  echo "error: npm ci failed."
  echo "After adding/updating packages locally, run: npm install"
  echo "Then commit BOTH package.json AND package-lock.json (and patches/ if changed)."
  exit 1
fi

if [ ! -d node_modules/react-native ]; then
  echo "error: node_modules incomplete after npm ci"
  exit 1
fi

echo "=== ci_post_clone complete ==="
