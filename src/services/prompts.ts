import type {
  UserProfile,
  SchedulePreference,
  TrainingEvent,
  Workout,
  Equipment,
  Injury,
  TimeSlot,
  MoodEntry,
  Benchmarks,
} from '@/types';
import { DAY_LABELS_FULL } from '@/constants/defaults';

function formatEquipment(equipmentJson: string): string {
  try {
    const eq: Equipment = JSON.parse(equipmentJson);
    const available = Object.entries(eq)
      .filter(([, v]) => v)
      .map(([k]) => k.replace(/_/g, ' '));
    return available.length > 0 ? available.join(', ') : 'None specified';
  } catch {
    return 'Not specified';
  }
}

function formatBasics(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.age) parts.push(`Age: ${profile.age}`);
  if (profile.sex && profile.sex !== 'prefer_not_to_say') {
    parts.push(`Sex: ${profile.sex}`);
  }
  if (profile.weight && profile.weight_unit) {
    parts.push(`Weight: ${profile.weight} ${profile.weight_unit}`);
  }
  if (profile.height_cm) {
    if (profile.height_unit === 'imperial') {
      const totalInches = Math.round(profile.height_cm / 2.54);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      parts.push(`Height: ${feet}'${inches}"`);
    } else {
      parts.push(`Height: ${profile.height_cm} cm`);
    }
  }
  return parts.length > 0 ? parts.join(' | ') : 'Not provided';
}

function formatMoodData(moodEntries: MoodEntry[]): string {
  if (moodEntries.length === 0) return 'No mood data logged yet.';

  const recent = moodEntries.slice(0, 7);
  const avgMood = (recent.reduce((s, m) => s + m.mood, 0) / recent.length).toFixed(1);
  const avgEnergy = (recent.reduce((s, m) => s + m.energy, 0) / recent.length).toFixed(1);
  const avgSleep = (recent.reduce((s, m) => s + m.sleep_quality, 0) / recent.length).toFixed(1);

  let summary = `Recent averages (${recent.length} entries): Mood ${avgMood}/5, Energy ${avgEnergy}/5, Sleep Quality ${avgSleep}/5`;

  // Sleep hours
  const withSleepHours = recent.filter((m) => m.sleep_hours);
  if (withSleepHours.length > 0) {
    const avgHrs = (withSleepHours.reduce((s, m) => s + m.sleep_hours!, 0) / withSleepHours.length).toFixed(1);
    summary += `, Sleep Hours avg ${avgHrs}h`;
  }

  // Stress
  const withStress = recent.filter((m) => m.stress);
  if (withStress.length > 0) {
    const avgStress = (withStress.reduce((s, m) => s + m.stress!, 0) / withStress.length).toFixed(1);
    summary += `, Stress ${avgStress}/5`;
  }

  // Resting HR
  const withHr = recent.filter((m) => m.resting_hr);
  if (withHr.length > 0) {
    const avgHr = Math.round(withHr.reduce((s, m) => s + m.resting_hr!, 0) / withHr.length);
    const latestHr = withHr[0].resting_hr;
    summary += `\nResting HR: avg ${avgHr}bpm, latest ${latestHr}bpm`;
    if (withHr.length >= 3 && latestHr! > avgHr + 5) {
      summary += ' (ELEVATED — consider recovery day)';
    }
  }

  // Weight trend
  const withWeight = recent.filter((m) => m.weight);
  if (withWeight.length > 0) {
    const latest = withWeight[0];
    summary += `\nWeight: ${latest.weight} ${latest.weight_unit || 'lbs'}`;
    if (withWeight.length >= 2) {
      const oldest = withWeight[withWeight.length - 1];
      const diff = latest.weight! - oldest.weight!;
      if (Math.abs(diff) >= 0.5) {
        summary += ` (${diff > 0 ? '+' : ''}${diff.toFixed(1)} over ${withWeight.length} entries)`;
      }
    }
  }

  const today = recent[0];
  if (today) {
    let todayLine = `\nToday: Mood ${today.mood}/5, Energy ${today.energy}/5, Sleep ${today.sleep_quality}/5`;
    if (today.stress) todayLine += `, Stress ${today.stress}/5`;
    if (today.sleep_hours) todayLine += `, Slept ${today.sleep_hours}h`;
    summary += todayLine;
  }

  return summary;
}

function formatBenchmarks(benchmarks: Benchmarks): string {
  const parts: string[] = [];

  function secondsToTime(s: number): string {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  if (benchmarks.five_k_seconds) {
    const pacePerKm = benchmarks.five_k_seconds / 5;
    parts.push(`5K: ${secondsToTime(benchmarks.five_k_seconds)} (${secondsToTime(Math.round(pacePerKm))}/km)`);
  }
  if (benchmarks.ten_k_seconds) {
    const pacePerKm = benchmarks.ten_k_seconds / 10;
    parts.push(`10K: ${secondsToTime(benchmarks.ten_k_seconds)} (${secondsToTime(Math.round(pacePerKm))}/km)`);
  }
  if (benchmarks.half_marathon_seconds) {
    const pacePerKm = benchmarks.half_marathon_seconds / 21.1;
    parts.push(`Half Marathon: ${secondsToTime(benchmarks.half_marathon_seconds)} (${secondsToTime(Math.round(pacePerKm))}/km)`);
  }
  if (benchmarks.ftp_watts) {
    parts.push(`FTP: ${benchmarks.ftp_watts}W`);
  }
  if (benchmarks.swim_100m_seconds) {
    parts.push(`Swim 100m: ${secondsToTime(benchmarks.swim_100m_seconds)}`);
  }
  if (benchmarks.max_hr) {
    const z2Low = Math.round(benchmarks.max_hr * 0.6);
    const z2High = Math.round(benchmarks.max_hr * 0.7);
    const z3Low = Math.round(benchmarks.max_hr * 0.7);
    const z3High = Math.round(benchmarks.max_hr * 0.8);
    const z4Low = Math.round(benchmarks.max_hr * 0.8);
    const z4High = Math.round(benchmarks.max_hr * 0.9);
    parts.push(`Max HR: ${benchmarks.max_hr}bpm | Z2: ${z2Low}-${z2High} | Z3: ${z3Low}-${z3High} | Z4: ${z4Low}-${z4High}`);
  }

  return parts.length > 0 ? parts.join('\n') : 'No benchmarks set.';
}

function formatRecentRpe(workouts: Workout[]): string {
  const withRpe = workouts.filter((w) => w.rpe && w.status === 'completed');
  if (withRpe.length === 0) return '';

  const avgRpe = (withRpe.reduce((s, w) => s + w.rpe!, 0) / withRpe.length).toFixed(1);
  const overDuration = withRpe.filter((w) => w.actual_duration && w.actual_duration > w.duration_minutes);
  const underDuration = withRpe.filter((w) => w.actual_duration && w.actual_duration < w.duration_minutes);

  let summary = `Recent RPE avg: ${avgRpe}/10 (from ${withRpe.length} workouts)`;
  if (overDuration.length > 0 || underDuration.length > 0) {
    summary += ` | Duration vs planned: ${overDuration.length} went over, ${underDuration.length} under`;
  }
  return summary;
}

function formatInjuries(injuriesJson: string): string {
  try {
    const injuries: Injury[] = JSON.parse(injuriesJson);
    if (injuries.length === 0) return 'None';
    return injuries
      .map(
        (i) =>
          `${i.area.replace(/_/g, ' ')} (${i.type}${i.recovered ? ', recovered' : ''}): ${i.notes}`
      )
      .join('\n  - ');
  } catch {
    return 'None reported';
  }
}

function formatSchedule(schedule: SchedulePreference[]): string {
  const slotNames: Record<TimeSlot, string> = {
    morning: 'Morning',
    midday: 'Midday',
    evening: 'Evening',
  };

  const lines: string[] = [];
  for (let d = 0; d < 7; d++) {
    const daySlots = schedule.filter((s) => s.day_of_week === d && s.available);
    if (daySlots.length === 0) {
      lines.push(`- ${DAY_LABELS_FULL[d]}: REST`);
    } else {
      const slots = daySlots
        .map(
          (s) =>
            `${slotNames[s.time_slot as TimeSlot]} (max ${s.max_duration_minutes}min)`
        )
        .join(', ');
      lines.push(`- ${DAY_LABELS_FULL[d]}: ${slots}`);
    }
  }
  return lines.join('\n');
}

function formatEvents(events: TrainingEvent[]): string {
  if (events.length === 0) return 'No events registered. Training for general fitness.';
  return events
    .map(
      (e) =>
        `- ${e.name} (${e.event_type.replace(/_/g, ' ')}) on ${e.event_date} — Priority ${e.priority}`
    )
    .join('\n');
}

function formatRecentActivity(workouts: Workout[]): string {
  if (workouts.length === 0) return 'No recent workout data.';

  const completed = workouts.filter((w) => w.status === 'completed').length;
  const skipped = workouts.filter((w) => w.status === 'skipped').length;
  const total = workouts.length;

  let summary = `${completed}/${total} completed (${Math.round((completed / total) * 100)}%)`;
  if (skipped > 0) {
    const skipReasons = workouts
      .filter((w) => w.status === 'skipped' && w.skip_reason)
      .map((w) => `${w.date}: ${w.skip_reason}`)
      .join('; ');
    summary += `\nSkipped ${skipped}: ${skipReasons || 'no reason given'}`;
  }
  return summary;
}

// ── Plan Generation Prompt ────────────────────────────────────────────

export function buildPlanGenerationPrompt(
  profile: UserProfile,
  schedule: SchedulePreference[],
  events: TrainingEvent[],
  recentWorkouts: Workout[],
  weekNumber: number,
  moodEntries: MoodEntry[] = [],
  benchmarks: Benchmarks = {}
): string {
  const injuryInstructions = formatInjuries(profile.injuries) !== 'None'
    ? `\n  IMPORTANT: Account for all listed injuries. Include appropriate warm-up, prehab exercises, and modifications as needed.`
    : '';

  return `You are FlexCoach, an expert fitness and endurance coach creating a detailed weekly training plan.

## Athlete Profile
- Basics: ${formatBasics(profile)}
- Experience: ${profile.experience_level}
- Injuries: ${formatInjuries(profile.injuries)}${injuryInstructions}
- Equipment: ${formatEquipment(profile.equipment)}
- Travel mode: ${profile.travel_mode ? 'YES — use hotel/travel-friendly alternatives only' : 'No'}

## Training Week: ${weekNumber}

## Training Principles
ENDURANCE (80/20 Polarized):
- 80% easy/conversational pace (Zone 1-2), 20% threshold or above
- Distribute endurance sessions across the week — no two consecutive hard sessions in same discipline
- Progressive volume: max 10% increase per week
- If in taper phase: reduce volume 30-50%, maintain some intensity

STRENGTH:
- Use the athlete's available equipment for strength programming
- Progressive overload via reps, tempo, complexity
- Core and posterior chain emphasis for athletic performance

## Schedule This Week
${formatSchedule(schedule)}

## Recent Activity (last 2 weeks)
${formatRecentActivity(recentWorkouts)}

## Athlete Mood & Energy
${formatMoodData(moodEntries)}

## Performance Benchmarks
${formatBenchmarks(benchmarks)}
${formatRecentRpe(recentWorkouts) ? `\n## Recent Effort Data\n${formatRecentRpe(recentWorkouts)}` : ''}

## Upcoming Events
${formatEvents(events)}

## Output Format
Return ONLY valid JSON:
{
  "weekSummary": "Brief overview of the week's training focus",
  "totalHours": number,
  "workouts": [
    {
      "date": "YYYY-MM-DD",
      "timeSlot": "morning|midday|evening",
      "discipline": "swim|bike|run|strength|rest|recovery|brick",
      "title": "Short descriptive title",
      "durationMinutes": number,
      "distance": number_or_null,
      "distanceUnit": "mi|km|yd|m" or null,
      "details": "SPECIFIC workout prescription. Include zones, distances, paces, intervals, sets, reps, rest periods. Start every session with warm-up including ACL prehab.",
      "why": "1-2 sentences explaining how this workout supports the athlete's goals and fits the overall training plan.",
      "structuredData": {}
    }
  ]
}

DISTANCE: For swim, bike, and run workouts, ALWAYS include "distance" (number) and "distanceUnit". Use "mi" for bike/run, "yd" for swim. Example: a 5K run → distance: 3.1, distanceUnit: "mi". A 1500yd swim → distance: 1500, distanceUnit: "yd". For strength/rest/recovery, set both to null.

IMPORTANT: Be SPECIFIC. Not "easy run" but "Easy Zone 2 run, 35 min at 6:00-6:30/km. 5 min warm-up walk with dynamic stretches. Include 4x20s strides in last 10 min. Cool down 5 min walk."`;
}

// ── Coach Chat Prompt ─────────────────────────────────────────────────

export function buildChatSystemPrompt(
  profile: UserProfile,
  todayWorkouts: Workout[],
  weekWorkouts: Workout[],
  events: TrainingEvent[],
  recentWorkouts: Workout[],
  moodEntries: MoodEntry[] = [],
  benchmarks: Benchmarks = {}
): string {
  const todaySummary =
    todayWorkouts.length > 0
      ? todayWorkouts
          .map((w) => `${w.discipline}: ${w.title} (${w.duration_minutes}min) — ${w.status}`)
          .join('\n')
      : 'Rest day (no workouts scheduled)';

  const weekSummary = weekWorkouts
    .map((w) => `${w.date} ${w.time_slot}: ${w.discipline} — ${w.title} [${w.status}]`)
    .join('\n');

  const injuryStyle = formatInjuries(profile.injuries) !== 'None'
    ? `\n- Be mindful of the athlete's injuries in ALL recommendations.`
    : '';
  const experienceStyle = profile.experience_level === 'beginner'
    ? 'Explain concepts when needed.'
    : profile.experience_level === 'experienced'
      ? 'The athlete is experienced; skip basics unless asked.'
      : 'The athlete has some experience; be moderately detailed.';

  return `You are FlexCoach, a knowledgeable and direct fitness coach having a conversation with your athlete.

## Your Style
- Specific and actionable. Never vague motivational fluff.
- Evidence-based training advice.${injuryStyle}
- Concise. ${experienceStyle}
- If the athlete asks to modify today's plan, swap workouts, or make changes, include a plan_update block.

## Athlete Context
- Basics: ${formatBasics(profile)}
- Equipment: ${formatEquipment(profile.equipment)}
- Travel mode: ${profile.travel_mode ? 'ON' : 'OFF'}
- Injuries: ${formatInjuries(profile.injuries)}

## Current Mood & Energy
${formatMoodData(moodEntries)}

## Performance Benchmarks
${formatBenchmarks(benchmarks)}
${formatRecentRpe(recentWorkouts) ? `\n## Recent Effort Data\n${formatRecentRpe(recentWorkouts)}` : ''}

## Today's Workout
${todaySummary}

## This Week's Plan
${weekSummary || 'No plan generated yet'}

## Recent Activity
${formatRecentActivity(recentWorkouts)}

## Upcoming Events
${formatEvents(events)}

## Plan Modification Format
When the athlete requests a plan change (swap workout, modify today's session, update equipment, etc.), include this block at the END of your response:

<plan_update>
{
  "action": "swap|modify|skip|add|update_equipment",
  "workoutId": number_or_null,
  "date": "YYYY-MM-DD_or_null",
  "changes": {
    "discipline": "new_discipline_if_changed",
    "title": "new_title",
    "details": "full_new_workout_description",
    "durationMinutes": new_duration,
    "distance": number_or_null,
    "distanceUnit": "mi|km|yd|m" or null,
    "equipment": {"key": true_or_false}
  }
}
</plan_update>

Only include plan_update when the athlete explicitly requests a change. For questions and advice, just respond conversationally.`;
}

// ── Swap Workout Prompt ──────────────────────────────────────────────

export function buildSwapPrompt(
  profile: UserProfile,
  schedule: SchedulePreference[],
  workoutToReplace: Workout,
  swapReason: string,
  weekWorkouts: Workout[],
  events: TrainingEvent[],
  recentWorkouts: Workout[],
  moodEntries: MoodEntry[] = [],
  benchmarks: Benchmarks = {}
): string {
  const weekSummary = weekWorkouts
    .map((w) => `${w.date} ${w.time_slot}: ${w.discipline} — ${w.title} [${w.status}]`)
    .join('\n');

  return `You are FlexCoach, an expert fitness and endurance coach. The athlete needs to replace one workout with a suitable alternative.

## Athlete Profile
- Basics: ${formatBasics(profile)}
- Experience: ${profile.experience_level}
- Injuries: ${formatInjuries(profile.injuries)}
- Equipment: ${formatEquipment(profile.equipment)}
- Travel mode: ${profile.travel_mode ? 'YES — use hotel/travel-friendly alternatives only' : 'No'}

## Workout to Replace
- Date: ${workoutToReplace.date}, Time Slot: ${workoutToReplace.time_slot}
- Discipline: ${workoutToReplace.discipline}
- Title: ${workoutToReplace.title}
- Duration: ${workoutToReplace.duration_minutes} min
- Details: ${workoutToReplace.details}

## Reason for Swap
${swapReason}

## This Week's Plan
${weekSummary || 'No other workouts this week'}

## Schedule
${formatSchedule(schedule)}

## Recent Activity (last 2 weeks)
${formatRecentActivity(recentWorkouts)}

## Athlete Mood & Energy
${formatMoodData(moodEntries)}

## Performance Benchmarks
${formatBenchmarks(benchmarks)}
${formatRecentRpe(recentWorkouts) ? `\n## Recent Effort Data\n${formatRecentRpe(recentWorkouts)}` : ''}

## Upcoming Events
${formatEvents(events)}

## Output Format
Return ONLY valid JSON for a single replacement workout:
{
  "discipline": "swim|bike|run|strength|rest|recovery|brick",
  "title": "Short descriptive title",
  "durationMinutes": number,
  "distance": number_or_null,
  "distanceUnit": "mi|km|yd|m" or null,
  "details": "SPECIFIC workout prescription. Include zones, distances, paces, intervals, sets, reps, rest periods.",
  "why": "1-2 sentences explaining why this is a good replacement given the swap reason and weekly plan."
}

CONSTRAINTS:
- If the swap reason involves facility or equipment access (pool closed, no gym, etc.), do NOT suggest the same discipline.
- Keep the same approximate duration as the original workout.
- Consider the rest of the week: avoid duplicating today's other sessions or creating back-to-back hard days in the same discipline.
- Use only the athlete's available equipment. Account for injuries.
- DISTANCE: For swim, bike, run, include distance and distanceUnit (mi for bike/run, yd for swim). For others, set both to null.
- Be SPECIFIC in details — not "easy run" but exact prescription with warm-up, zones, and cool-down.`;
}
