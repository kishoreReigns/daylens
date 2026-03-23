// ─────────────────────────────────────────────
//  plugins/withScreenTime.js
//  Expo Config Plugin — adds PACKAGE_USAGE_STATS
//  permission to AndroidManifest.xml
//  (This is a "special" permission — not a danger
//   permission — so it can't be granted via dialog.
//   User must grant it in Settings > Usage Access.)
// ─────────────────────────────────────────────
const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Adds <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />
 * to AndroidManifest.xml with the appOp tag required for this special permission.
 */
const withScreenTimePermission = (config) => {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const PERM = 'android.permission.PACKAGE_USAGE_STATS';
    const alreadyAdded = manifest['uses-permission'].some(
      (p) => p.$?.['android:name'] === PERM,
    );

    if (!alreadyAdded) {
      manifest['uses-permission'].push({
        $: {
          'android:name': PERM,
          'tools:ignore':  'ProtectedPermissions',
        },
      });
    }

    // Make sure tools namespace is declared in manifest node
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    return modConfig;
  });
};

module.exports = withScreenTimePermission;
