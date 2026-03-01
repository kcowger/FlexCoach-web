export type Discipline = 'swim' | 'bike' | 'run' | 'strength' | 'rest' | 'recovery' | 'brick';

export type TimeSlot = 'morning' | 'midday' | 'evening';

export type WorkoutStatus = 'pending' | 'completed' | 'skipped';

export type TrainingPhase = 'base' | 'build' | 'peak' | 'taper' | 'recovery';

export type EventType =
  | 'sprint_tri'
  | 'olympic_tri'
  | 'half_iron'
  | 'full_iron'
  | 'marathon'
  | 'half_marathon'
  | '10k'
  | '5k'
  | 'century_ride'
  | 'open_water_swim'
  | 'other';

export type EventPriority = 'A' | 'B' | 'C';

export type ExperienceLevel = 'beginner' | 'returning' | 'experienced';

export interface UserProfile {
  id: number;
  name: string;
  api_key_configured: number;
  equipment: string; // JSON
  injuries: string; // JSON
  goals: string;
  experience_level: ExperienceLevel;
  weekly_hours_available: number;
  travel_mode: number;
  onboarding_complete: number;
  created_at: string;
  updated_at: string;
}

export interface SchedulePreference {
  id: number;
  day_of_week: number; // 0=Monday, 6=Sunday
  time_slot: TimeSlot;
  available: number;
  max_duration_minutes: number;
}

export interface TrainingEvent {
  id: number;
  name: string;
  event_type: EventType;
  event_date: string;
  distance_details: string;
  priority: EventPriority;
  notes: string;
  created_at: string;
}

export interface TrainingBlock {
  id: number;
  start_date: string;
  end_date: string;
  phase: TrainingPhase;
  focus: string;
  target_hours: number;
  notes: string;
  created_at: string;
}

export interface WorkoutPlan {
  id: number;
  week_number: number;
  week_start_date: string;
  plan_json: string; // JSON
  generated_at: string;
  generation_context: string;
}

export interface Workout {
  id: number;
  plan_id: number;
  date: string;
  time_slot: TimeSlot;
  discipline: Discipline;
  title: string;
  duration_minutes: number;
  details: string;
  structured_data: string; // JSON
  status: WorkoutStatus;
  skip_reason: string;
  completed_at: string | null;
  notes: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context_snapshot: string;
}

// Parsed types (from JSON fields)
export interface Equipment {
  mat: boolean;
  pushup_bars: boolean;
  kettlebell_35lb: boolean;
  ab_roller: boolean;
  pool_access: boolean;
  indoor_bike: boolean;
  outdoor_bike: boolean;
  open_space: boolean;
  [key: string]: boolean;
}

export interface Injury {
  area: string;
  type: string;
  notes: string;
  recovered: boolean;
}

export interface GeneratedWorkout {
  date: string;
  timeSlot: TimeSlot;
  discipline: Discipline;
  title: string;
  durationMinutes: number;
  details: string;
  structuredData?: Record<string, unknown>;
}

export interface GeneratedPlan {
  weekSummary: string;
  totalHours: number;
  workouts: GeneratedWorkout[];
}

export interface GeneratedBlock {
  phases: Array<{
    phase: TrainingPhase;
    startDate: string;
    endDate: string;
    focus: string;
    targetHoursPerWeek: number;
    notes: string;
  }>;
}

export interface PlanUpdate {
  action: 'swap' | 'modify' | 'skip' | 'add' | 'update_equipment';
  workoutId?: number;
  date?: string;
  changes: Record<string, unknown>;
}
