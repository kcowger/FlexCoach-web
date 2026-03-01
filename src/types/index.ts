export type Discipline = 'swim' | 'bike' | 'run' | 'strength' | 'rest' | 'recovery' | 'brick';

export type TimeSlot = 'morning' | 'midday' | 'evening';

export type WorkoutStatus = 'pending' | 'completed' | 'skipped';

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

export type Sex = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type WeightUnit = 'lbs' | 'kg';
export type HeightUnit = 'imperial' | 'metric';
export type MoodContext = 'daily' | 'pre_workout';
export type DistanceUnit = 'mi' | 'km' | 'yd' | 'm';

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
  age?: number;
  weight?: number;
  weight_unit?: WeightUnit;
  height_cm?: number;
  height_unit?: HeightUnit;
  sex?: Sex;
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
  rpe?: number;              // 1-10 post-workout perceived exertion
  actual_duration?: number;  // minutes actually done
  distance?: number;         // planned distance (e.g. 3.1 for a 5K run)
  distance_unit?: DistanceUnit; // mi/km for bike/run, yd/m for swim
  actual_distance?: number;  // post-workout actual distance
  why?: string;              // explanation of why this workout exists
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context_snapshot: string;
}

export interface MoodEntry {
  id: number;
  date: string;
  mood: number;
  energy: number;
  sleep_quality: number;
  sleep_hours?: number;
  stress?: number;
  resting_hr?: number;
  weight?: number;
  weight_unit?: WeightUnit;
  context: MoodContext;
  workout_id?: number;
  created_at: string;
}

export interface Benchmarks {
  five_k_seconds?: number;
  ten_k_seconds?: number;
  half_marathon_seconds?: number;
  ftp_watts?: number;
  swim_100m_seconds?: number;
  max_hr?: number;
  updated_at?: string;
}

// Parsed types (from JSON fields)
export type Equipment = Record<string, boolean>;

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
  distance?: number;
  distanceUnit?: DistanceUnit;
  details: string;
  why?: string;
  structuredData?: Record<string, unknown>;
}

export interface GeneratedPlan {
  weekSummary: string;
  totalHours: number;
  workouts: GeneratedWorkout[];
}

export interface PlanUpdate {
  action: 'swap' | 'modify' | 'skip' | 'add' | 'update_equipment';
  workoutId?: number;
  date?: string;
  changes: Record<string, unknown>;
}
