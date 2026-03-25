// ─────────────────────────────────────────────
//  plugins/withScreenTime.js
//  Expo Config Plugin — injects real Android
//  UsageStatsManager native module directly into
//  the main app (no separate Gradle subproject).
//
//  Does three things during prebuild:
//  1. Copies ScreenTimeModule.kt + ScreenTimePackage.kt
//     into android/app/src/main/java/com/daylens/ai/screentime/
//  2. Registers ScreenTimePackage in MainApplication.kt
//  3. Adds PACKAGE_USAGE_STATS to AndroidManifest.xml
// ─────────────────────────────────────────────
const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

// ── 1. Copy Kotlin source into the Android app ────────────────────
const withScreenTimeNativeCode = (config) => {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const destDir = path.join(
        config.modRequest.platformProjectRoot,
        "app", "src", "main", "java",
        "com", "daylens", "ai", "screentime"
      );
      const srcDir = path.join(
        config.modRequest.projectRoot,
        "modules", "screen-time", "android-src"
      );

      fs.mkdirSync(destDir, { recursive: true });

      ["ScreenTimeModule.kt", "ScreenTimePackage.kt"].forEach((file) => {
        const src = path.join(srcDir, file);
        const dest = path.join(destDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log(`[withScreenTime] Copied ${file} → android app source`);
        } else {
          console.warn(`[withScreenTime] Source not found: ${src}`);
        }
      });

      return config;
    },
  ]);
};

// ── 2. Register ScreenTimePackage in MainApplication.kt ───────────
const withScreenTimeMainApplication = (config) => {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    const importLine = "import com.daylens.ai.screentime.ScreenTimePackage";

    // Add import if not already present
    if (!contents.includes(importLine)) {
      // Insert after the last `import` line in the file
      contents = contents.replace(
        /(import [^\n]+\n)(\n*class )/,
        `$1${importLine}\n$2`
      );
    }

    // Add package registration if not already present
    if (!contents.includes("ScreenTimePackage()")) {
      contents = contents.replace(
        /val packages = PackageList\(this\)\.packages/,
        "val packages = PackageList(this).packages\n        packages.add(ScreenTimePackage())"
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};

// ── 3. Add PACKAGE_USAGE_STATS permission ─────────────────────────
const withScreenTimePermission = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    const PERM = "android.permission.PACKAGE_USAGE_STATS";
    const already = manifest["uses-permission"].some(
      (p) => p.$?.["android:name"] === PERM
    );

    if (!already) {
      manifest["uses-permission"].push({
        $: {
          "android:name": PERM,
          "tools:ignore": "ProtectedPermissions",
        },
      });
    }

    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    return config;
  });
};

// ── Compose all three mods ────────────────────────────────────────
module.exports = (config) => {
  config = withScreenTimeNativeCode(config);
  config = withScreenTimeMainApplication(config);
  config = withScreenTimePermission(config);
  return config;
};
