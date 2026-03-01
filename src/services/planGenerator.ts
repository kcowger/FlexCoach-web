import type { GeneratedPlan, GeneratedBlock } from '@/types';
import { createMessage } from './claude';
import { buildBlockOutlinePrompt, buildPlanGenerationPrompt } from './prompts';
import {
  getProfile,
  getAvailableSlots,
  getUpcomingEvents,
  getRecentWorkouts,
  getCurrentBlock,
  saveTrainingBlocks,
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

export async function generateBlockOutline(pid: string): Promise<void> {
  const profile = getProfile(pid);
  const events = getUpcomingEvents(pid);
  const schedule = getAvailableSlots(pid);

  const systemPrompt = buildBlockOutlinePrompt(profile, events, schedule);
  const response = await createMessage(
    systemPrompt,
    [{ role: 'user', content: 'Generate my training block periodization outline starting from today.' }],
    2048
  );

  const blockData = parseJsonFromResponse(response) as GeneratedBlock;

  const blocks = blockData.phases.map((phase) => ({
    start_date: phase.startDate,
    end_date: phase.endDate,
    phase: phase.phase,
    focus: phase.focus,
    target_hours: phase.targetHoursPerWeek,
    notes: phase.notes,
  }));

  saveTrainingBlocks(pid, blocks);
}

export async function generateWeekPlan(
  pid: string,
  weekStartDate?: string
): Promise<GeneratedPlan> {
  const weekStart = weekStartDate || getWeekStartISO();
  const profile = getProfile(pid);
  const schedule = getAvailableSlots(pid);
  const events = getUpcomingEvents(pid);
  const currentBlock = getCurrentBlock(pid);
  const recentWorkouts = getRecentWorkouts(pid, 14);
  const weekNumber = calculateWeekNumber(profile.created_at, weekStart);

  const systemPrompt = buildPlanGenerationPrompt(
    profile,
    schedule,
    events,
    currentBlock,
    recentWorkouts,
    weekNumber
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

  const planId = saveWeekPlan(
    pid,
    weekNumber,
    weekStart,
    JSON.stringify(planData),
    JSON.stringify({ weekNumber, weekStart, blockPhase: currentBlock?.phase })
  );

  const workoutsToSave = planData.workouts.map((w) => ({
    date: w.date,
    time_slot: w.timeSlot,
    discipline: w.discipline,
    title: w.title,
    duration_minutes: w.durationMinutes,
    details: w.details,
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
