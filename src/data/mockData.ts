// ─────────────────────────────────────────────
//  DayLens AI · Mock Data  (TypeScript)
// ─────────────────────────────────────────────
import { ScoreTier } from '../constants/colors';

// ── Interfaces ────────────────────────────────

export interface ScreenTimeData {
    hours: number;
    minutes: number;
    delta: number;
    unit: string;
}

export interface StepsData {
    count: number;
    delta: number;
    unit: string;
}

export interface SpendingData {
    amount: number;
    delta: number;
    unit: string;
}

export interface TodayData {
    date: Date;
    lifeScore: number;
    screenTime: ScreenTimeData;
    steps: StepsData;
    spending: SpendingData;
}

export interface InsightData {
    lifeScore: number;
    emoji: string;
    keyInsight: string;
    suggestion: string;
    tags: string[];
    mood: string;
    moodEmoji: string;
}

export interface HistoryEntry {
    id: string;
    date: string;
    score: number;
    summary: string;
    emoji: string;
}

export interface TierResult {
    label: string;
    tier: ScoreTier;
}

// ── Data ──────────────────────────────────────

export const todayData: TodayData = {
    date: new Date(),
    lifeScore: 78,
    screenTime: { hours: 4, minutes: 22, delta: -12, unit: 'min vs avg' },
    steps: { count: 8_430, delta: +1200, unit: 'steps vs avg' },
    spending: { amount: 34.5, delta: -8.2, unit: 'vs avg day' },
};

export const insightData: InsightData = {
    lifeScore: 78,
    emoji: '🧠',
    keyInsight:
        'Your focus time peaked between 9\u201311\u00a0AM, aligning with low screen time and a productive walk. You\u2019re building a strong morning momentum.',
    suggestion:
        'Try to cap social media to 30\u00a0min before 8\u00a0PM \u2014 your best sleep nights correlate with less evening screen exposure.',
    tags: ['Focus', 'Sleep', 'Movement'],
    mood: 'Balanced',
    moodEmoji: '😌',
};

export const historyData: HistoryEntry[] = [
    {
        id: '1',
        date: 'Wednesday, Mar 18',
        score: 82,
        summary: 'Outstanding focus day. Walked 10k steps and stayed under budget.',
        emoji: '🌟',
    },
    {
        id: '2',
        date: 'Tuesday, Mar 17',
        score: 65,
        summary: 'Afternoon slump hit hard. Screen time spiked after 3 PM.',
        emoji: '🌤️',
    },
    {
        id: '3',
        date: 'Monday, Mar 16',
        score: 71,
        summary: 'Good start, decent movement. Spending was slightly above average.',
        emoji: '✅',
    },
    {
        id: '4',
        date: 'Sunday, Mar 15',
        score: 58,
        summary: 'Rest day. Low activity but healthy screen boundaries kept score up.',
        emoji: '☁️',
    },
    {
        id: '5',
        date: 'Saturday, Mar 14',
        score: 90,
        summary: 'Best day this week. Long outdoor walk, minimal phone use, on budget.',
        emoji: '🚀',
    },
    {
        id: '6',
        date: 'Friday, Mar 13',
        score: 44,
        summary: 'Late night scrolling and an expensive dinner pushed scores down.',
        emoji: '🌧️',
    },
    {
        id: '7',
        date: 'Thursday, Mar 12',
        score: 76,
        summary: 'Consistent day with solid habits across all three pillars.',
        emoji: '💫',
    },
];

// ── Utilities ─────────────────────────────────

/** Returns a tier result for a score 0–100. */
export function getScoreTier(score: number): TierResult {
    if (score >= 80) return { label: 'Excellent', tier: 'excellent' };
    if (score >= 60) return { label: 'Good', tier: 'good' };
    if (score >= 40) return { label: 'Fair', tier: 'warn' };
    return { label: 'Needs Work', tier: 'fire' };
}

export function formatDate(date: Date = new Date()): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

export function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}
