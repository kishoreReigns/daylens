// ─────────────────────────────────────────────
//  useStepCounter · Real-time pedometer hook
//  Uses expo-sensors Pedometer API
//  iOS  → Core Motion (CMPedometer)
//  Android → Step counter / detector sensor
// ─────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { Pedometer } from 'expo-sensors';
import { Platform, AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

export interface StepData {
    /** Steps counted today (since midnight) */
    todaySteps: number;
    /** Whether the pedometer hardware is available */
    isAvailable: boolean;
    /** Whether we're actively watching steps */
    isTracking: boolean;
    /** Error message (if any) */
    error: string | null;
    /** Daily goal (configurable) */
    goal: number;
    /** Progress toward goal (0–1) */
    progress: number;
    /** Delta vs 7-day average (mock for now) */
    deltaVsAvg: number;
}

const DEFAULT_GOAL = 10_000;
const SEVEN_DAY_AVG = 7_200; // mock average — replace with real history later

/**
 * Hook that:
 * 1. Checks pedometer availability
 * 2. Gets historical step count since midnight
 * 3. Subscribes to live step updates
 * 4. Re-fetches on app foreground to stay fresh
 */
export function useStepCounter(goal: number = DEFAULT_GOAL): StepData {
    const [todaySteps, setTodaySteps] = useState(0);
    const [isAvailable, setIsAvailable] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track live steps added *since* the subscription started
    const liveStepsRef = useRef(0);
    const baseStepsRef = useRef(0);

    // Get midnight timestamp
    const getMidnight = useCallback(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, []);

    // Fetch steps from midnight → now
    const fetchHistoricalSteps = useCallback(async () => {
        try {
            const start = getMidnight();
            const end = new Date();
            const result = await Pedometer.getStepCountAsync(start, end);
            baseStepsRef.current = result.steps;
            liveStepsRef.current = 0;
            setTodaySteps(result.steps);
        } catch (e: any) {
            // getStepCountAsync may not be available on all Android devices
            // In that case we rely purely on subscription
            if (Platform.OS === 'android') {
                // Not critical — subscription still works
            } else {
                setError(e.message ?? 'Failed to fetch step history');
            }
        }
    }, [getMidnight]);

    useEffect(() => {
        let subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;

        const init = async () => {
            // 1) Check hardware availability
            try {
                const available = await Pedometer.isAvailableAsync();
                setIsAvailable(available);

                if (!available) {
                    setError('Pedometer not available on this device');
                    return;
                }
            } catch {
                setIsAvailable(false);
                setError('Could not check pedometer availability');
                return;
            }

            // 2) Fetch historical count for today
            await fetchHistoricalSteps();

            // 3) Start live subscription
            try {
                subscription = Pedometer.watchStepCount((result) => {
                    liveStepsRef.current = result.steps;
                    setTodaySteps(baseStepsRef.current + result.steps);
                });
                setIsTracking(true);
            } catch (e: any) {
                setError(e.message ?? 'Failed to start step tracking');
            }
        };

        init();

        // 4) Re-fetch when user returns to app (handles midnight rollover, etc.)
        const handleAppState = (state: AppStateStatus) => {
            if (state === 'active') {
                fetchHistoricalSteps();
            }
        };
        const appStateSub = AppState.addEventListener('change', handleAppState);

        return () => {
            subscription?.remove();
            appStateSub.remove();
            setIsTracking(false);
        };
    }, [fetchHistoricalSteps]);

    const progress = Math.min(todaySteps / goal, 1);
    const deltaVsAvg = todaySteps - SEVEN_DAY_AVG;

    return {
        todaySteps,
        isAvailable,
        isTracking,
        error,
        goal,
        progress,
        deltaVsAvg,
    };
}
