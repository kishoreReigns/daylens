// ─────────────────────────────────────────────
//  src/lib/config.ts
//  App-wide configuration & API keys
//
//  SETUP:
//  1. Go to https://aistudio.google.com
//  2. Click "Get API Key" → "Create API key"
//  3. Replace GEMINI_API_KEY below
// ─────────────────────────────────────────────

export const GEMINI_API_KEY = 'YOUR_GEMINI_KEY';  // ← replace with AIza... key

if (GEMINI_API_KEY === 'YOUR_GEMINI_KEY') {
  console.warn(
    '[DayLens] Gemini API key not set.\n' +
    'Get a free key at https://aistudio.google.com and edit src/lib/config.ts',
  );
}
