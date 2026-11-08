const fs = require('fs');
const path = require('path');

const scriptPath = path.resolve(__dirname, '../node_modules/expo-constants/scripts/get-app-config-android.gradle');

if (fs.existsSync(scriptPath)) {
  let content = fs.readFileSync(scriptPath, 'utf8');

  // Check if already cleanly patched (hasVariants defined exactly once and no respondsTo)
  const matches = content.match(/def hasVariants = false/g);
  if (matches && matches.length === 1 && !content.includes('respondsTo("getLibraryVariants")')) {
    console.log('✅ [patch-expo-constants] Already cleanly patched.');
    process.exit(0);
  }

  // Restore to baseline if prior patch variants exist
  content = content.replace(/def hasVariants = false;[^\n]+\n/g, 'if (project.android.respondsTo("getLibraryVariants")) {\n');
  content = content.replace(/\s*def hasVariants = false[\s\S]*?if \(hasVariants\) \{/g, 'if (project.android.respondsTo("getLibraryVariants")) {');

  // Insert hasVariants definition once after projectRoot declaration
  const rootTarget = 'def projectRoot = file("${customProjectRoot ?: rootProject.projectDir}")';
  if (content.includes(rootTarget) && !content.includes('def hasVariants = false')) {
    content = content.replace(
      rootTarget,
      `${rootTarget}\n\n  def hasVariants = false\n  try {\n    hasVariants = project.android.hasProperty("libraryVariants") && project.android.libraryVariants != null\n  } catch (Throwable ignored) {\n    hasVariants = false\n  }`
    );
  }

  // Replace all remaining respondsTo("getLibraryVariants") with hasVariants
  content = content.replace(/if\s*\(project\.android\.respondsTo\("getLibraryVariants"\)\)\s*\{/g, 'if (hasVariants) {');

  fs.writeFileSync(scriptPath, content, 'utf8');
  console.log('✅ [patch-expo-constants] Cleanly patched get-app-config-android.gradle for AGP 9 compatibility.');
} else {
  console.log('ℹ️ [patch-expo-constants] expo-constants script not found at', scriptPath);
}
