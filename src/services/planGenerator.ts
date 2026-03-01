import type { GeneratedPlan } from '@/types';
import { createMessage } from './claude';
import { buildPlanGenerationPrompt } from './prompts';
import {
  getProfile,
  getAvailableSlots,
  getUpcomingEvents,
  getRecentWorkouts,
  getRecentMoodEntries,
  getBenchmarks,
  saveWeekPlan,
  saveWorkouts,
} from '@/storage/repository';
import { getWeekStartISO, calculateWeekNumber } from '@/utils/date';

function parseJsonFromResponse(text: string): unknown {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    const start = jsonStr.search(/[{[]/);
    if (start >= 0) {
      return JSON.parse(jsonStr.slice(start));
    }
    throw new Error('Could not parse JSON from Claude response');
  }
}

export async function generateWeekPlan(
  pid: string,
  weekStartDate?: string
): Promise<GeneratedPlan> {
  const weekStart = weekStartDate || getWeekStartISO();
  const profile = getProfile(pid);
  const schedule = getAvailableSlots(pid);
  const events = getUpcomingEvents(pid);
  const recentWorkouts = getRecentWorkouts(pid, 14);
  const recentMood = getRecentMoodEntries(pid, 14);
  const benchmarks = getBenchmarks(pid);
  const weekNumber = calculateWeekNumber(profile.created_at, weekStart);

  const systemPrompt = buildPlanGenerationPrompt(
    profile,
    schedule,
    events,
    recentWorkouts,
    weekNumber,
    recentMood,
    benchmarks
  );

  const response = await createMessage(
    systemPrompt,
    [
      {
        role: 'user',
        content: `Generate my detailed training plan for the week starting ${weekStart}.`,
      },
    ],
    4096
  );

  const planData = parseJsonFromResponse(response) as GeneratedPlan;

  if (!planData?.workouts || !Array.isArray(planData.workouts)) {
    throw new Error('Invalid week plan format from AI response');
  }

  const planId = saveWeekPlan(
    pid,
    weekNumber,
    weekStart,
    JSON.stringify(planData),
    JSON.stringify({ weekNumber, weekStart })
  );

  const workoutsToSave = planData.workouts.map((w) => ({
    date: w.date,
    time_slot: w.timeSlot,
    discipline: w.discipline,
    title: w.title,
    duration_minutes: w.durationMinutes,
    details: w.details,
    why: w.why || '',
    structured_data: w.structuredData ? JSON.stringify(w.structuredData) : '',
  }));

  saveWorkouts(pid, planId, workoutsToSave);

  return planData;
}

export function parsePlanUpdate(
  responseText: string
): { action: string; workoutId?: number; date?: string; changes: Record<string, unknown> } | null {
  const match = responseText.match(/<plan_update>\s*([\s\S]*?)\s*<\/plan_update>/);
  if (!match) return null;

  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}
