# Build Play Store AAB on Windows — avoids CMake "Permission denied" and path-length failures.
$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot

# Short Gradle home avoids Windows MAX_PATH (260) errors in Hermes prefab paths.
$gradleHome = "C:\gradle"
New-Item -ItemType Directory -Force -Path $gradleHome | Out-Null
$env:GRADLE_USER_HOME = $gradleHome
$env:NODE_ENV = "production"

Write-Host "==> Stopping Gradle daemons..."
.\gradlew --stop 2>$null

Write-Host "==> Clearing native CMake caches..."
$nativeCaches = @(
    "$PSScriptRoot\app\.cxx",
    "$PSScriptRoot\..\node_modules\react-native-reanimated\android\.cxx",
    "$PSScriptRoot\..\node_modules\react-native-worklets\android\.cxx",
    "$PSScriptRoot\..\node_modules\react-native-gesture-handler\android\.cxx",
    "$PSScriptRoot\..\node_modules\expo-modules-core\android\.cxx"
)
foreach ($p in $nativeCaches) {
    if (Test-Path $p) {
        Write-Host "    Removing $p"
        Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
    }
}

Write-Host "==> Building release AAB (bundleRelease)..."
Write-Host "    Close Android Studio / expo run:android before building if you see Permission denied."
.\gradlew bundleRelease --no-daemon

if ($LASTEXITCODE -eq 0) {
    $aab = Get-ChildItem -Path "$PSScriptRoot\app\build\outputs\bundle\release\*.aab" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($aab) {
        Write-Host ""
        Write-Host "SUCCESS: $($aab.FullName)" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "BUILD FAILED. If Permission denied: close all Gradle/Android processes, rerun this script." -ForegroundColor Red
    Write-Host "If path too long: enable Windows long paths or keep GRADLE_USER_HOME=C:\gradle" -ForegroundColor Red
    exit $LASTEXITCODE
}

Pop-Location
