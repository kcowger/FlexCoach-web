import type { Workout } from '@/types';
import { createMessage } from './claude';
import { buildSwapPrompt } from './prompts';
import {
  getProfile,
  getAvailableSlots,
  getUpcomingEvents,
  getWeekWorkouts,
  getRecentWorkouts,
  getRecentMoodEntries,
  getBenchmarks,
} from '@/storage/repository';
import { getWeekStartISO } from '@/utils/date';

export interface SwapSuggestion {
  discipline: string;
  title: string;
  durationMinutes: number;
  distance?: number;
  distanceUnit?: string;
  details: string;
  why?: string;
}

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

export async function generateSwapSuggestion(
  pid: string,
  workout: Workout,
  reason: string
): Promise<SwapSuggestion> {
  const profile = getProfile(pid);
  const schedule = getAvailableSlots(pid);
  const weekStart = getWeekStartISO(new Date(workout.date + 'T00:00:00'));
  const weekWorkouts = getWeekWorkouts(pid, weekStart);
  const events = getUpcomingEvents(pid);
  const recentWorkouts = getRecentWorkouts(pid, 14);
  const recentMood = getRecentMoodEntries(pid, 14);
  const benchmarks = getBenchmarks(pid);

  const systemPrompt = buildSwapPrompt(
    profile,
    schedule,
    workout,
    reason,
    weekWorkouts,
    events,
    recentWorkouts,
    recentMood,
    benchmarks
  );

  const response = await createMessage(
    systemPrompt,
    [
      {
        role: 'user',
        content: `Suggest a replacement for my ${workout.discipline} workout "${workout.title}" because: ${reason}`,
      },
    ],
    1024
  );

  const suggestion = parseJsonFromResponse(response) as SwapSuggestion;

  if (!suggestion?.title || !suggestion?.details) {
    throw new Error('Invalid swap suggestion format from AI');
  }

  return suggestion;
}
