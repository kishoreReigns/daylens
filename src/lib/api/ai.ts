// ─────────────────────────────────────────────
//  src/lib/api/ai.ts
//  Google Gemini 1.5 Flash — DayLens AI insights
//  Free tier: 1,500 requests/day  ·  no SDK needed
// ─────────────────────────────────────────────
import { GEMINI_API_KEY } from '../config';

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── Input data shape ──────────────────────────
export interface AIInputData {
  steps:         number;       // today's steps
  stepGoal:      number;       // e.g. 10000
  screenTimeMs:  number;       // total screen time in ms today
  topApps:       { appName: string; totalTimeMs: number }[];
  totalSpent:    number;       // today's total spending
  dailyBudget:   number;       // e.g. 50
  topCategories: string[];     // e.g. ['food', 'transport']
}

// ── Output shape (mirrors InsightData from mockData) ──
export interface AIInsightResult {
  lifeScore:  number;        // 0–100
  emoji:      string;        // single emoji representing insight
  keyInsight: string;        // 1–2 sentence key finding
  suggestion: string;        // 1–2 sentence actionable advice
  tags:       string[];      // 2–4 short topic tags
  mood:       string;        // e.g. "Balanced", "Energised", "Drained"
  moodEmoji:  string;        // emoji for mood
}

// ── Compute a local life score (fallback if AI fails) ─
function computeScore(data: AIInputData): number {
  const stepScore    = Math.min(data.steps / data.stepGoal, 1) * 100;
  const screenHours  = data.screenTimeMs / 3_600_000;
  const screenScore  = Math.max(0, 100 - screenHours * 10); // -10pts per hour
  const budgetRatio  = data.totalSpent / (data.dailyBudget || 50);
  const spendScore   = Math.max(0, 100 - Math.max(0, budgetRatio - 0.5) * 100);
  return Math.round(stepScore * 0.35 + screenScore * 0.35 + spendScore * 0.30);
}

// ── Main function ─────────────────────────────
export async function getAIInsights(
  data: AIInputData,
): Promise<AIInsightResult> {
  const screenHours   = (data.screenTimeMs / 3_600_000).toFixed(1);
  const stepPercent   = Math.round((data.steps / data.stepGoal) * 100);
  const budgetPercent = Math.round((data.totalSpent / (data.dailyBudget || 50)) * 100);
  const topAppsText   = data.topApps.length
    ? data.topApps.slice(0, 3)
        .map((a) => `${a.appName} (${(a.totalTimeMs / 60000).toFixed(0)}m)`)
        .join(', ')
    : 'not available';

  const prompt = `
You are a personal health and productivity AI coach inside a life-tracking app called DayLens.
Analyse today's data and return a JSON object with motivating, specific, actionable insights.

TODAY'S DATA:
- Steps: ${data.steps.toLocaleString()} / ${data.stepGoal.toLocaleString()} goal (${stepPercent}% achieved)
- Screen time: ${screenHours} hours total. Top apps: ${topAppsText}
- Spending: $${data.totalSpent.toFixed(2)} of $${data.dailyBudget} budget (${budgetPercent}% used)
- Top spending categories: ${data.topCategories.join(', ') || 'none yet'}

RESPONSE FORMAT — return ONLY valid JSON, no markdown, no explanation:
{
  "lifeScore": <number 0-100, holistic wellness score based on the data>,
  "emoji": <single emoji representing the key insight theme>,
  "keyInsight": <1-2 sentences: specific observation about today's data, mention actual numbers>,
  "suggestion": <1-2 sentences: one concrete, actionable tip based on the data>,
  "tags": <array of 2-4 short (1-2 word) topic tags like ["Focus","Movement","Budget"]>,
  "mood": <single word mood label e.g. "Energised","Balanced","Drained","Focused","Restless">,
  "moodEmoji": <single emoji for the mood>
}
`.trim();

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature:      0.7,
          maxOutputTokens:  512,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini HTTP ${response.status}`);
    }

    const json = await response.json();
    const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const result: AIInsightResult = JSON.parse(text);

    // Clamp lifeScore to valid range
    result.lifeScore = Math.max(0, Math.min(100, Math.round(result.lifeScore)));
    return result;
  } catch (err) {
    console.error('[ai] getAIInsights failed:', err);
    // Graceful fallback — local computation
    return buildFallback(data);
  }
}

// ── Fallback (no API key / network error) ─────
function buildFallback(data: AIInputData): AIInsightResult {
  const score      = computeScore(data);
  const stepPct    = Math.round((data.steps / data.stepGoal) * 100);
  const screenHrs  = (data.screenTimeMs / 3_600_000).toFixed(1);
  const overBudget = data.totalSpent > data.dailyBudget;

  let mood      = 'Balanced';
  let moodEmoji = '😌';
  if (score >= 80)      { mood = 'Energised'; moodEmoji = '⚡'; }
  else if (score >= 60) { mood = 'Balanced';  moodEmoji = '😌'; }
  else if (score >= 40) { mood = 'Restless';  moodEmoji = '😐'; }
  else                  { mood = 'Drained';   moodEmoji = '😓'; }

  return {
    lifeScore:  score,
    emoji:      stepPct >= 80 ? '🏃' : '💡',
    keyInsight: `You've completed ${stepPct}% of your step goal (${data.steps.toLocaleString()} steps) and spent ${Number(screenHrs)}h on your phone today.`,
    suggestion: overBudget
      ? `You're over budget by $${(data.totalSpent - data.dailyBudget).toFixed(2)} — try to skip non-essential purchases for the rest of the day.`
      : `Great spending discipline! Try to hit your ${data.stepGoal.toLocaleString()} step goal to boost your wellness score.`,
    tags:      ['Movement', 'Screen', 'Budget'],
    mood,
    moodEmoji,
  };
}
