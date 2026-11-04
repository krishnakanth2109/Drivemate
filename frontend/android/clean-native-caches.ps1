# Clears stale CMake/ninja caches that cause "Permission denied" / "failed recompaction" on Windows.
# Prefer: .\build-release-aab.ps1 (cleans + builds AAB with short Gradle path).
$ErrorActionPreference = "SilentlyContinue"

Write-Host "Stopping Gradle daemons..."
Push-Location $PSScriptRoot
.\gradlew --stop | Out-Null

$paths = @(
    "$PSScriptRoot\app\.cxx",
    "$PSScriptRoot\..\node_modules\react-native-reanimated\android\.cxx",
    "$PSScriptRoot\..\node_modules\react-native-worklets\android\.cxx",
    "$PSScriptRoot\..\node_modules\react-native-gesture-handler\android\.cxx",
    "$PSScriptRoot\..\node_modules\expo-modules-core\android\.cxx"
)

foreach ($p in $paths) {
    if (Test-Path $p) {
        Write-Host "Removing $p"
        Remove-Item -Recurse -Force $p
    }
}

Write-Host "Running gradlew clean..."
$env:NODE_ENV = "production"
.\gradlew clean
Pop-Location
Write-Host "Done. Run: .\gradlew bundleRelease"
