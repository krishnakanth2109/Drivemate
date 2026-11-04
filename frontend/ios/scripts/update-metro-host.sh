#!/bin/bash
# Injects the Mac's LAN IP into DevMetroHost.plist so physical devices launched
# from Xcode can reach Metro (localhost on the phone is the phone itself).
set -euo pipefail

HOST_FILE="${SRCROOT}/MyTDP/DevMetroHost.plist"
IP=""

if [[ -n "${REACT_NATIVE_PACKAGER_HOSTNAME:-}" ]]; then
  IP="${REACT_NATIVE_PACKAGER_HOSTNAME}"
elif command -v ipconfig >/dev/null 2>&1; then
  IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
  if [[ -z "${IP}" ]]; then
    IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
  fi
fi

if [[ ! -f "${HOST_FILE}" ]]; then
  echo "warning: DevMetroHost.plist not found at ${HOST_FILE}"
  exit 0
fi

if [[ -n "${IP}" ]]; then
  /usr/libexec/PlistBuddy -c "Set :MetroHost ${IP}" "${HOST_FILE}" 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Add :MetroHost string ${IP}" "${HOST_FILE}"
  echo "Metro bundler host for device debug: ${IP}"
else
  /usr/libexec/PlistBuddy -c "Set :MetroHost " "${HOST_FILE}" 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Add :MetroHost string " "${HOST_FILE}"
  echo "warning: Could not detect Mac LAN IP. Create ios/.xcode.env.local with:"
  echo "  export REACT_NATIVE_PACKAGER_HOSTNAME=YOUR_MAC_IP"
fi
