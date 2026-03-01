import type {
  UserProfile,
  SchedulePreference,
  TrainingEvent,
  TrainingBlock,
  Workout,
  Equipment,
  Injury,
  TimeSlot,
  MoodEntry,
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

  let summary = `Recent averages (${recent.length} entries): Mood ${avgMood}/5, Energy ${avgEnergy}/5, Sleep ${avgSleep}/5`;

  const today = recent[0];
  if (today) {
    summary += `\nToday: Mood ${today.mood}/5, Energy ${today.energy}/5, Sleep ${today.sleep_quality}/5`;
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
    return 'Left knee (torn ACL, fully recovered)';
  }
}

function formatSchedule(schedule: SchedulePreference[]): string {
  const slotNames: Record<TimeSlot, string> = {
    morning: '5-7am',
    midday: '11am-1pm',
    evening: '6-9pm',
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

function formatCurrentBlock(block: TrainingBlock | null): string {
  if (!block) return 'No training block active. Use general fitness base building.';
  return `Phase: ${block.phase.toUpperCase()} | Focus: ${block.focus} | Target: ${block.target_hours}h/week | ${block.start_date} to ${block.end_date}`;
}

// ── Plan Generation Prompt ────────────────────────────────────────────

export function buildBlockOutlinePrompt(
  profile: UserProfile,
  events: TrainingEvent[],
  schedule: SchedulePreference[]
): string {
  return `You are FlexCoach, an expert triathlon and strength coach designing a multi-week training periodization plan.

## Athlete Profile
- Basics: ${formatBasics(profile)}
- Experience: Returning triathlete (took a year off, maintaining base fitness)
- Injuries: ${formatInjuries(profile.injuries)}
  CRITICAL: Left knee ACL history. All programming must be ACL-conscious.
- Equipment: ${formatEquipment(profile.equipment)}
- Weekly hours available: ${profile.weekly_hours_available}
- Goals: ${profile.goals}

## Upcoming Events
${formatEvents(events)}

## Training Principles
- 80/20 polarized endurance: 80% Zone 1-2, 20% Zone 3-5
- Progressive overload for strength
- Recovery weeks every 3-4 weeks (volume reduced 30-40%)
- If an event is registered, structure as: Base → Build → Peak → Taper
- If no event, use rolling 4-week mesocycles (3 build + 1 recovery)

## Available Schedule
${formatSchedule(schedule)}

## Output Format
Return ONLY valid JSON with this structure:
{
  "phases": [
    {
      "phase": "base|build|peak|taper|recovery",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "focus": "Brief description of phase focus",
      "targetHoursPerWeek": number,
      "notes": "Key considerations for this phase"
    }
  ]
}

Cover up to 12 weeks from today, or to the event date plus 1 week post-event recovery if an event is registered.`;
}

export function buildPlanGenerationPrompt(
  profile: UserProfile,
  schedule: SchedulePreference[],
  events: TrainingEvent[],
  currentBlock: TrainingBlock | null,
  recentWorkouts: Workout[],
  weekNumber: number,
  moodEntries: MoodEntry[] = []
): string {
  return `You are FlexCoach, an expert triathlon and strength coach creating a detailed weekly training plan.

## Athlete Profile
- Basics: ${formatBasics(profile)}
- Experience: Returning triathlete
- Injuries: ${formatInjuries(profile.injuries)}
  CRITICAL: Left knee ACL history. Every session must include:
    - Appropriate warm-up with knee prehab
    - No deep squats below parallel without prior warm-up
    - Avoid high-impact plyometrics
    - Favor single-leg stability work
    - Prefer softer running surfaces when possible
- Equipment: ${formatEquipment(profile.equipment)}
- Travel mode: ${profile.travel_mode ? 'YES — use hotel/travel-friendly alternatives only' : 'No'}

## Current Training Block
${formatCurrentBlock(currentBlock)}

## Training Week: ${weekNumber}

## Training Principles
ENDURANCE (80/20 Polarized):
- 80% easy/conversational pace (Zone 1-2), 20% threshold or above
- Distribute swim/bike/run across the week — no two consecutive hard sessions in same discipline
- Progressive volume: max 10% increase per week
- Include 1 brick workout (bike→run) when schedule allows
- If in taper phase: reduce volume 30-50%, maintain some intensity

STRENGTH (2-3x/week):
- Compound movements: push-ups (with bars), kettlebell swings, goblet squats, Turkish get-ups, ab roller
- Progressive overload via reps, tempo, complexity (35lb KB limit for now)
- Core and posterior chain emphasis for triathlon performance
- ACL prehab in every strength session: single-leg balance, lateral band walks, bodyweight squats

## Schedule This Week
${formatSchedule(schedule)}

## Recent Activity (last 2 weeks)
${formatRecentActivity(recentWorkouts)}

## Athlete Mood & Energy
${formatMoodData(moodEntries)}

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
      "details": "SPECIFIC workout prescription. Include zones, distances, paces, intervals, sets, reps, rest periods. Start every session with warm-up including ACL prehab.",
      "structuredData": {}
    }
  ]
}

IMPORTANT: Be SPECIFIC. Not "easy run" but "Easy Zone 2 run, 35 min at 6:00-6:30/km. 5 min warm-up walk + ACL prehab (single-leg balance 30s each, 10 bodyweight squats). Include 4x20s strides in last 10 min. Cool down 5 min walk."`;
}

// ── Coach Chat Prompt ─────────────────────────────────────────────────

export function buildChatSystemPrompt(
  profile: UserProfile,
  todayWorkouts: Workout[],
  weekWorkouts: Workout[],
  events: TrainingEvent[],
  recentWorkouts: Workout[],
  moodEntries: MoodEntry[] = []
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

  return `You are FlexCoach, a knowledgeable and direct triathlon coach having a conversation with your athlete.

## Your Style
- Specific and actionable. Never vague motivational fluff.
- Evidence-based training advice.
- ACL-conscious for ALL recommendations (left knee history).
- Concise. The athlete is experienced; skip basics unless asked.
- If the athlete asks to modify today's plan, swap workouts, or make changes, include a plan_update block.

## Athlete Context
- Basics: ${formatBasics(profile)}
- Equipment: ${formatEquipment(profile.equipment)}
- Travel mode: ${profile.travel_mode ? 'ON' : 'OFF'}
- Injuries: ${formatInjuries(profile.injuries)}

## Current Mood & Energy
${formatMoodData(moodEntries)}

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
    "equipment": {"key": true_or_false}
  }
}
</plan_update>

Only include plan_update when the athlete explicitly requests a change. For questions and advice, just respond conversationally.`;
}
