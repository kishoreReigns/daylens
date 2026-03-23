// ─────────────────────────────────────────────
//  DayLens AI · Design Tokens · Colors
//  Theme: Vital Dark
//  Every color carries semantic meaning for a
//  life-activity tracking app:
//    Purple  → insight / intelligence / premium
//    Pink    → vitality / life energy
//    Amber   → achievement / wealth
//    Emerald → health / movement / nature
//    Sky     → calm / clarity / AI
//    Orange  → activity / screen time
//    Teal    → balance / recovery
// ─────────────────────────────────────────────

export const Colors = {
    // ── Backgrounds (warm near-black, purple undertone) ──
    background: '#0C0B16',
    backgroundElevated: '#131224',
    card: '#18172A',
    cardElevated: '#1F1E38',
    cardBorder: '#2D2B48',

    // ── Life-energy gradient: Violet → Magenta → Amber ──
    gradientStart: '#7B2FBE',
    gradientMid: '#E91E8C',
    gradientEnd: '#FF8C04',

    // ── Accent palette (each semantically meaningful) ──
    accentPurple: '#8B5CF6',  // insight, intelligence, premium
    accentPink: '#EC4899',  // vitality, life energy
    accentAmber: '#F59E0B',  // achievement, wealth
    accentEmerald: '#10B981',  // health, movement, nature
    accentSky: '#38BDF8',  // calm, clarity, AI
    accentOrange: '#F97316',  // activity, screen time
    accentBlue: '#38BDF8',  // alias → accentSky
    accentTeal: '#10B981',  // alias → accentEmerald

    // ── Score tier colors (struggle → thriving spectrum) ──
    scoreFire: '#F43F5E',  // < 40  · rose-red   · urgent
    scoreWarn: '#F59E0B',  // 40–59 · amber      · caution
    scoreGood: '#2DD4BF',  // 60–79 · teal-mint  · balanced
    scoreExcellent: '#8B5CF6',  // 80+   · violet     · peak/thriving

    // ── Semantic ──
    positive: '#10B981',
    negative: '#F43F5E',
    neutral: '#9C94BF',
    warning: '#F59E0B',

    // ── Typography (warm-tinted white) ──
    textPrimary: '#F0EEFF',
    textSecondary: '#9C94BF',
    textTertiary: '#564F7A',
    textMuted: '#332E55',

    // ── Structure ──
    divider: '#201D38',
    tabBar: '#100F1E',
    tabActive: '#8B5CF6',
    tabInactive: '#403B6B',

    // ── Overlay ──
    overlay: 'rgba(12,11,22,0.88)',
    shimmer: 'rgba(255,255,255,0.03)',
} as const;

export const GradientPurpleBlue: readonly [string, string, string] = [
    Colors.gradientStart,
    Colors.gradientMid,
    Colors.gradientEnd,
];

export const GradientCardSheen: readonly [string, string, string] = [
    'rgba(139,92,246,0.16)',
    'rgba(56,189,248,0.06)',
    'rgba(0,0,0,0)',
];

export type ScoreTier = 'fire' | 'warn' | 'good' | 'excellent';

// Ring gradient pairs match their tier meaning
export const GradientScoreRing: Record<ScoreTier, readonly [string, string]> = {
    fire: ['#F43F5E', '#FF7043'],  // rose → coral
    warn: ['#F59E0B', '#F97316'],  // amber → orange
    good: ['#2DD4BF', '#38BDF8'],  // teal  → sky
    excellent: ['#8B5CF6', '#EC4899'],  // violet → pink (peak energy)
};

// ── Shared palette type ───────────────────────
export type ColorPalette = { [K in keyof typeof Colors]: string };

// ── Light theme ("Vital Light") ───────────────
//  Warm cream-white backgrounds, same accent palette
export const LightColors: ColorPalette = {
    background: '#F5F3FF',
    backgroundElevated: '#FFFFFF',
    card: '#FFFFFF',
    cardElevated: '#F0EEF9',
    cardBorder: '#E2DFEF',

    gradientStart: '#7B2FBE',
    gradientMid: '#E91E8C',
    gradientEnd: '#FF8C04',

    accentPurple: '#7C3AED',
    accentPink: '#DB2777',
    accentAmber: '#D97706',
    accentEmerald: '#059669',
    accentSky: '#0284C7',
    accentOrange: '#EA580C',
    accentBlue: '#0284C7',
    accentTeal: '#0D9488',

    scoreFire: '#E11D48',
    scoreWarn: '#D97706',
    scoreGood: '#0D9488',
    scoreExcellent: '#7C3AED',

    positive: '#059669',
    negative: '#E11D48',
    neutral: '#7C6FA8',
    warning: '#D97706',

    textPrimary: '#0C0B16',
    textSecondary: '#4A4468',
    textTertiary: '#7C6FA8',
    textMuted: '#C0BAD9',

    divider: '#EAE7F5',
    tabBar: '#FFFFFF',
    tabActive: '#7C3AED',
    tabInactive: '#C0BAD9',

    overlay: 'rgba(12,11,22,0.45)',
    shimmer: 'rgba(139,92,246,0.04)',
};
