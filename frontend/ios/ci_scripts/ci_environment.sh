#!/bin/sh
# Shared environment for all Xcode Cloud scripts and xcodebuild phases.
set -e

export CI=1
export EXPO_NO_TELEMETRY=1 
export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
export HOMEBREW_NO_AUTO_UPDATE=TRUE

# Xcode Cloud does not ship Node.js — install via Homebrew when missing.
ensure_node() {
  if command -v node >/dev/null 2>&1; then
    export NODE_BINARY="$(command -v node)"
    return 0
  fi

  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
  NODE_MAJOR="${NODE_MAJOR_VERSION:-$(cat "$REPO_ROOT/.nvmrc" 2>/dev/null | tr -d 'v' | cut -d. -f1)}"
  NODE_MAJOR="${NODE_MAJOR:-22}"
  echo "Node.js not found — installing node@${NODE_MAJOR} via Homebrew..."
  brew install "node@${NODE_MAJOR}"
  brew link --overwrite --force "node@${NODE_MAJOR}"

  export NODE_BINARY="$(command -v node)"
  if [ -z "$NODE_BINARY" ]; then
    echo "error: failed to install Node.js"
    exit 1
  fi
}

ensure_node
export PATH="$(dirname "$NODE_BINARY"):$PATH"
