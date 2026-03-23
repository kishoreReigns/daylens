// ─────────────────────────────────────────────
//  DayLens AI · Design Tokens · Typography
// ─────────────────────────────────────────────
import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
});

type TypographyStyle = Pick<
    TextStyle,
    | 'fontFamily'
    | 'fontSize'
    | 'fontWeight'
    | 'letterSpacing'
    | 'lineHeight'
    | 'textTransform'
>;

export const Typography: Record<string, TypographyStyle> = {
    // Display
    displayXL: {
        fontFamily,
        fontSize: 56,
        fontWeight: '700',
        letterSpacing: -2,
        lineHeight: 60,
    },
    displayLG: {
        fontFamily,
        fontSize: 40,
        fontWeight: '700',
        letterSpacing: -1.5,
        lineHeight: 46,
    },

    // Headings
    h1: {
        fontFamily,
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.8,
        lineHeight: 34,
    },
    h2: {
        fontFamily,
        fontSize: 22,
        fontWeight: '600',
        letterSpacing: -0.5,
        lineHeight: 28,
    },
    h3: {
        fontFamily,
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: -0.3,
        lineHeight: 24,
    },

    // Body
    bodyLG: {
        fontFamily,
        fontSize: 17,
        fontWeight: '400',
        letterSpacing: -0.2,
        lineHeight: 26,
    },
    bodyMD: {
        fontFamily,
        fontSize: 15,
        fontWeight: '400',
        letterSpacing: -0.1,
        lineHeight: 22,
    },
    bodySM: {
        fontFamily,
        fontSize: 13,
        fontWeight: '400',
        letterSpacing: 0,
        lineHeight: 18,
    },

    // UI Labels
    labelLG: {
        fontFamily,
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.1,
        lineHeight: 20,
    },
    labelMD: {
        fontFamily,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.2,
        lineHeight: 16,
    },
    labelSM: {
        fontFamily,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.4,
        lineHeight: 14,
        textTransform: 'uppercase',
    },

    // Score numerals
    scoreNumeral: {
        fontFamily,
        fontSize: 52,
        fontWeight: '800',
        letterSpacing: -3,
        lineHeight: 56,
    },
    scoreNumeralSM: {
        fontFamily,
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -2,
        lineHeight: 36,
    },
};
