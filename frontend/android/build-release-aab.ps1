# Build Script for Drivemate Release AAB
Write-Host "Building Drivemate Release Android App Bundle (.aab)..." -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot

./gradlew.bat bundleRelease

if ($LASTEXITCODE -eq 0) {
    $src = "$PSScriptRoot\app\build\outputs\bundle\release\app-release.aab"
    $dest = "$PSScriptRoot\..\..\Drivemate-release.aab"
    Copy-Item -Path $src -Destination $dest -Force
    Write-Host "`nBUILD SUCCESS! Bundle copied to: $dest" -ForegroundColor Green
} else {
    Write-Host "`nBUILD FAILED!" -ForegroundColor Red
}

