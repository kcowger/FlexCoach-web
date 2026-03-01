import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Ruler,
  Target,
  Dumbbell,
  Heart,
  Calendar,
  Clock,
  Activity,
  Timer,
  TrendingDown,
  Settings,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMoodStore } from '@/stores/useMoodStore';
import {
  createEvent,
  deleteEvent,
  upsertSchedulePreference,
  getBenchmarks,
  updateBenchmarks,
  getWeightLog,
} from '@/storage/repository';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  DEFAULT_EQUIPMENT,
  EQUIPMENT_LABELS,
  EVENT_TYPE_LABELS,
  DAY_LABELS,
  TIME_SLOT_LABELS,
} from '@/constants/defaults';
import type {
  Benchmarks,
  Equipment,
  Injury,
  ExperienceLevel,
  EventType,
  EventPriority,
  TimeSlot,
  Sex,
  WeightUnit,
  HeightUnit,
} from '@/types';

const inputClasses =
  'bg-surface text-text border border-surface-light rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary focus:outline-none';
const selectClasses =
  'bg-surface text-text border border-surface-light rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary focus:outline-none';

export default function ProfilePage() {
  const navigate = useNavigate();
  const pid = useAppStore((s) => s.activeProfileId)!;
  const { logout } = useAuthStore();
  const {
    profile,
    schedule,
    events,
    loadProfile,
    updateProfile,
    loadSchedule,
    loadEvents,
  } = useProfileStore();
  const { recentMood, loadRecentMood } = useMoodStore();

  // Local state for editing
  const [name, setName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [goals, setGoals] = useState('');
  const [equipment, setEquipment] = useState<Equipment>({ ...DEFAULT_EQUIPMENT });
  const [injuries, setInjuries] = useState<Injury[]>([]);

  // Basics fields
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('imperial');
  const [sex, setSex] = useState<Sex | ''>('');

  // Benchmarks
  const [benchmarks, setBenchmarks] = useState<Benchmarks>({});
  const [fiveKMin, setFiveKMin] = useState('');
  const [fiveKSec, setFiveKSec] = useState('');
  const [tenKMin, setTenKMin] = useState('');
  const [tenKSec, setTenKSec] = useState('');
  const [halfMarHr, setHalfMarHr] = useState('');
  const [halfMarMin, setHalfMarMin] = useState('');
  const [halfMarSec, setHalfMarSec] = useState('');
  const [ftpWatts, setFtpWatts] = useState('');
  const [swimMin, setSwimMin] = useState('');
  const [swimSec, setSwimSec] = useState('');
  const [maxHr, setMaxHr] = useState('');
  const [weightLog, setWeightLog] = useState<Array<{ date: string; weight: number; unit: WeightUnit }>>([]);

  // Event modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('other');
  const [newEventPriority, setNewEventPriority] = useState<EventPriority>('B');

  // Injury modal
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [newInjuryArea, setNewInjuryArea] = useState('');
  const [newInjuryType, setNewInjuryType] = useState('');
  const [newInjuryNotes, setNewInjuryNotes] = useState('');

  useEffect(() => {
    loadProfile(pid);
    loadSchedule(pid);
    loadEvents(pid);
    loadRecentMood(pid);
    const b = getBenchmarks(pid);
    setBenchmarks(b);
    if (b.five_k_seconds) {
      setFiveKMin(String(Math.floor(b.five_k_seconds / 60)));
      setFiveKSec(String(b.five_k_seconds % 60));
    }
    if (b.ten_k_seconds) {
      setTenKMin(String(Math.floor(b.ten_k_seconds / 60)));
      setTenKSec(String(b.ten_k_seconds % 60));
    }
    if (b.half_marathon_seconds) {
      setHalfMarHr(String(Math.floor(b.half_marathon_seconds / 3600)));
      setHalfMarMin(String(Math.floor((b.half_marathon_seconds % 3600) / 60)));
      setHalfMarSec(String(b.half_marathon_seconds % 60));
    }
    if (b.ftp_watts) setFtpWatts(String(b.ftp_watts));
    if (b.swim_100m_seconds) {
      setSwimMin(String(Math.floor(b.swim_100m_seconds / 60)));
      setSwimSec(String(b.swim_100m_seconds % 60));
    }
    if (b.max_hr) setMaxHr(String(b.max_hr));
    setWeightLog(getWeightLog(pid, 30));
  }, [pid, loadProfile, loadSchedule, loadEvents, loadRecentMood]);

  // Sync local state when profile loads
  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setExperienceLevel(profile.experience_level);
    setWeeklyHours(profile.weekly_hours_available);
    setGoals(profile.goals || '');
    try {
      setEquipment(JSON.parse(profile.equipment) as Equipment);
    } catch {
      setEquipment({ ...DEFAULT_EQUIPMENT });
    }
    try {
      setInjuries(JSON.parse(profile.injuries) as Injury[]);
    } catch {
      setInjuries([]);
    }
    // Basics
    if (profile.age) setAge(String(profile.age));
    if (profile.weight) setWeight(String(profile.weight));
    if (profile.weight_unit) setWeightUnit(profile.weight_unit);
    if (profile.height_cm) {
      if (profile.height_unit === 'imperial') {
        const totalInches = Math.round(profile.height_cm / 2.54);
        setHeightFeet(String(Math.floor(totalInches / 12)));
        setHeightInches(String(totalInches % 12));
      } else {
        setHeightCm(String(profile.height_cm));
      }
    }
    if (profile.height_unit) setHeightUnit(profile.height_unit);
    if (profile.sex) setSex(profile.sex);
  }, [profile]);

  // ── Save Handlers ──────────────────────────────────────────────────

  function saveProfileInfo() {
    updateProfile(pid, {
      name,
      experience_level: experienceLevel,
      weekly_hours_available: weeklyHours,
    });
  }

  function saveGoals() {
    updateProfile(pid, { goals });
  }

  function saveBasics() {
    const heightInCm =
      heightUnit === 'imperial'
        ? ((Number(heightFeet) || 0) * 12 + (Number(heightInches) || 0)) * 2.54
        : Number(heightCm) || undefined;
    updateProfile(pid, {
      age: Number(age) || undefined,
      weight: Number(weight) || undefined,
      weight_unit: weightUnit,
      height_cm: heightInCm || undefined,
      height_unit: heightUnit,
      sex: sex || undefined,
    });
  }

  function saveBenchmarks() {
    const updates: Benchmarks = { ...benchmarks };
    const fk = (Number(fiveKMin) || 0) * 60 + (Number(fiveKSec) || 0);
    if (fk > 0) updates.five_k_seconds = fk; else delete updates.five_k_seconds;
    const tk = (Number(tenKMin) || 0) * 60 + (Number(tenKSec) || 0);
    if (tk > 0) updates.ten_k_seconds = tk; else delete updates.ten_k_seconds;
    const hm = (Number(halfMarHr) || 0) * 3600 + (Number(halfMarMin) || 0) * 60 + (Number(halfMarSec) || 0);
    if (hm > 0) updates.half_marathon_seconds = hm; else delete updates.half_marathon_seconds;
    if (Number(ftpWatts)) updates.ftp_watts = Number(ftpWatts); else delete updates.ftp_watts;
    const sw = (Number(swimMin) || 0) * 60 + (Number(swimSec) || 0);
    if (sw > 0) updates.swim_100m_seconds = sw; else delete updates.swim_100m_seconds;
    if (Number(maxHr)) updates.max_hr = Number(maxHr); else delete updates.max_hr;
    updateBenchmarks(pid, updates);
    setBenchmarks(updates);
  }

  function toggleEquipment(key: string) {
    const updated = { ...equipment, [key]: !equipment[key] };
    setEquipment(updated);
    updateProfile(pid, { equipment: JSON.stringify(updated) });
  }

  function toggleInjuryRecovered(index: number) {
    const updated = [...injuries];
    updated[index] = { ...updated[index], recovered: !updated[index].recovered };
    setInjuries(updated);
    updateProfile(pid, { injuries: JSON.stringify(updated) });
  }

  function removeInjury(index: number) {
    const updated = injuries.filter((_, i) => i !== index);
    setInjuries(updated);
    updateProfile(pid, { injuries: JSON.stringify(updated) });
  }

  function handleAddInjury() {
    if (!newInjuryArea.trim() || !newInjuryType.trim()) return;
    const updated = [
      ...injuries,
      {
        area: newInjuryArea.trim(),
        type: newInjuryType.trim(),
        notes: newInjuryNotes.trim(),
        recovered: false,
      },
    ];
    setInjuries(updated);
    updateProfile(pid, { injuries: JSON.stringify(updated) });
    setShowInjuryModal(false);
    setNewInjuryArea('');
    setNewInjuryType('');
    setNewInjuryNotes('');
  }

  function handleAddEvent() {
    if (!newEventName.trim() || !newEventDate) return;
    createEvent(pid, {
      name: newEventName.trim(),
      event_date: newEventDate,
      event_type: newEventType,
      priority: newEventPriority,
      distance_details: '',
      notes: '',
    });
    loadEvents(pid);
    setShowEventModal(false);
    setNewEventName('');
    setNewEventDate('');
    setNewEventType('other');
    setNewEventPriority('B');
  }

  function handleDeleteEvent(id: number) {
    deleteEvent(pid, id);
    loadEvents(pid);
  }

  function handleToggleScheduleSlot(dayOfWeek: number, timeSlot: TimeSlot) {
    const existing = schedule.find(
      (s) => s.day_of_week === dayOfWeek && s.time_slot === timeSlot
    );
    const isAvailable = existing ? !!existing.available : false;
    upsertSchedulePreference(pid, dayOfWeek, timeSlot, !isAvailable);
    loadSchedule(pid);
  }

  function isSlotAvailable(dayOfWeek: number, timeSlot: string): boolean {
    const slot = schedule.find(
      (s) => s.day_of_week === dayOfWeek && s.time_slot === timeSlot
    );
    return slot ? !!slot.available : false;
  }

  function handleSwitchProfile() {
    navigate('/profiles');
  }

  async function handleLogout() {
    await logout();
    navigate('/lock');
  }

  if (!profile) {
    return (
      <div className="bg-background text-text min-h-full flex items-center justify-center">
        <p className="text-muted">Loading profile...</p>
      </div>
    );
  }

  const timeSlots: TimeSlot[] = ['morning', 'midday', 'evening'];
  const priorityOptions: EventPriority[] = ['A', 'B', 'C'];

  return (
    <div className="bg-background text-text min-h-full pb-8">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-xl font-bold text-text">Profile</h1>
      </div>

      {/* 1. Profile Info */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text">Profile Info</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm text-muted mb-1 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
              className={selectClasses}
            >
              <option value="beginner">Beginner</option>
              <option value="returning">Intermediate (Returning)</option>
              <option value="experienced">Advanced (Experienced)</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">
              Weekly Hours Available
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className={inputClasses}
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button title="Save" variant="primary" size="sm" onClick={saveProfileInfo} />
          </div>
        </div>
      </Card>

      {/* 2. Basics */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Ruler className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text">Basics</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted mb-1 block">Age</label>
              <input
                type="number"
                placeholder="e.g. 30"
                min={13}
                max={100}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Sex</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex)}
                className={selectClasses}
              >
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Weight</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={weightUnit === 'lbs' ? 'e.g. 170' : 'e.g. 77'}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={`${inputClasses} flex-1`}
              />
              <button
                type="button"
                onClick={() => setWeightUnit(weightUnit === 'lbs' ? 'kg' : 'lbs')}
                className="cursor-pointer rounded-xl bg-surface border border-surface-light px-4 py-3 text-sm font-medium text-muted hover:text-text transition-colors min-w-[60px]"
              >
                {weightUnit}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Height</label>
            <div className="flex gap-2">
              {heightUnit === 'imperial' ? (
                <>
                  <input
                    type="number"
                    placeholder="ft"
                    min={3}
                    max={8}
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(e.target.value)}
                    className={`${inputClasses} flex-1`}
                  />
                  <input
                    type="number"
                    placeholder="in"
                    min={0}
                    max={11}
                    value={heightInches}
                    onChange={(e) => setHeightInches(e.target.value)}
                    className={`${inputClasses} flex-1`}
                  />
                </>
              ) : (
                <input
                  type="number"
                  placeholder="e.g. 178"
                  min={100}
                  max={250}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className={`${inputClasses} flex-1`}
                />
              )}
              <button
                type="button"
                onClick={() => setHeightUnit(heightUnit === 'imperial' ? 'metric' : 'imperial')}
                className="cursor-pointer rounded-xl bg-surface border border-surface-light px-4 py-3 text-sm font-medium text-muted hover:text-text transition-colors min-w-[60px]"
              >
                {heightUnit === 'imperial' ? 'ft/in' : 'cm'}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button title="Save" variant="primary" size="sm" onClick={saveBasics} />
          </div>
        </div>
      </Card>

      {/* Benchmarks */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Timer className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text">Benchmarks</h2>
        </div>

        <div className="flex flex-col gap-3">
          {/* 5K */}
          <div>
            <label className="text-sm text-muted mb-1 block">5K Time</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" placeholder="mm" value={fiveKMin} onChange={(e) => setFiveKMin(e.target.value)} className={`${inputClasses} w-20`} />
              <span className="text-muted">:</span>
              <input type="number" min="0" max="59" placeholder="ss" value={fiveKSec} onChange={(e) => setFiveKSec(e.target.value)} className={`${inputClasses} w-20`} />
            </div>
          </div>

          {/* 10K */}
          <div>
            <label className="text-sm text-muted mb-1 block">10K Time</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" placeholder="mm" value={tenKMin} onChange={(e) => setTenKMin(e.target.value)} className={`${inputClasses} w-20`} />
              <span className="text-muted">:</span>
              <input type="number" min="0" max="59" placeholder="ss" value={tenKSec} onChange={(e) => setTenKSec(e.target.value)} className={`${inputClasses} w-20`} />
            </div>
          </div>

          {/* Half Marathon */}
          <div>
            <label className="text-sm text-muted mb-1 block">Half Marathon</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" placeholder="hh" value={halfMarHr} onChange={(e) => setHalfMarHr(e.target.value)} className={`${inputClasses} w-16`} />
              <span className="text-muted">:</span>
              <input type="number" min="0" max="59" placeholder="mm" value={halfMarMin} onChange={(e) => setHalfMarMin(e.target.value)} className={`${inputClasses} w-16`} />
              <span className="text-muted">:</span>
              <input type="number" min="0" max="59" placeholder="ss" value={halfMarSec} onChange={(e) => setHalfMarSec(e.target.value)} className={`${inputClasses} w-16`} />
            </div>
          </div>

          {/* FTP */}
          <div>
            <label className="text-sm text-muted mb-1 block">Cycling FTP</label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" placeholder="e.g. 200" value={ftpWatts} onChange={(e) => setFtpWatts(e.target.value)} className={`${inputClasses} w-28`} />
              <span className="text-sm text-muted">watts</span>
            </div>
          </div>

          {/* Swim pace */}
          <div>
            <label className="text-sm text-muted mb-1 block">Swim Pace (per 100m)</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" placeholder="mm" value={swimMin} onChange={(e) => setSwimMin(e.target.value)} className={`${inputClasses} w-20`} />
              <span className="text-muted">:</span>
              <input type="number" min="0" max="59" placeholder="ss" value={swimSec} onChange={(e) => setSwimSec(e.target.value)} className={`${inputClasses} w-20`} />
            </div>
          </div>

          {/* Max HR */}
          <div>
            <label className="text-sm text-muted mb-1 block">Max Heart Rate</label>
            <div className="flex items-center gap-2">
              <input type="number" min="100" max="250" placeholder="e.g. 185" value={maxHr} onChange={(e) => setMaxHr(e.target.value)} className={`${inputClasses} w-28`} />
              <span className="text-sm text-muted">bpm</span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button title="Save" variant="primary" size="sm" onClick={saveBenchmarks} />
          </div>
        </div>
      </Card>

      {/* Weight Trend */}
      {weightLog.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-text">Weight Trend</h2>
          </div>

          <div className="flex flex-col gap-1">
            {weightLog.slice(-10).reverse().map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <span className="text-muted text-xs">{entry.date}</span>
                <span className="font-medium">{entry.weight} {entry.unit}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. Goals */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text">Goals</h2>
        </div>

        <textarea
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          rows={3}
          placeholder="Describe your training goals..."
          className={`${inputClasses} resize-none`}
        />

        <div className="flex justify-end pt-3">
          <Button title="Save" variant="primary" size="sm" onClick={saveGoals} />
        </div>
      </Card>

      {/* 3. Equipment */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text">Equipment</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.keys(DEFAULT_EQUIPMENT).map((key) => (
            <button
              key={key}
              onClick={() => toggleEquipment(key)}
              className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                equipment[key]
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-surface-light text-muted border border-surface-light'
              }`}
            >
              {EQUIPMENT_LABELS[key] || key}
            </button>
          ))}
        </div>
      </Card>

      {/* 4. Injuries */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-text">Injuries</h2>
          </div>
          <button
            onClick={() => setShowInjuryModal(true)}
            className="cursor-pointer flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {injuries.length === 0 && (
          <p className="text-sm text-muted">No injuries recorded.</p>
        )}

        <div className="flex flex-col gap-2">
          {injuries.map((injury, index) => (
            <div
              key={index}
              className="flex items-start justify-between rounded-xl bg-surface-light/50 px-3 py-2"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-text">
                  {injury.area} - {injury.type}
                </p>
                {injury.notes && (
                  <p className="text-xs text-muted mt-0.5">{injury.notes}</p>
                )}
                <button
                  onClick={() => toggleInjuryRecovered(index)}
                  className={`cursor-pointer mt-1 text-xs font-medium ${
                    injury.recovered ? 'text-success' : 'text-warning'
                  }`}
                >
                  {injury.recovered ? 'Recovered' : 'Active'}
                </button>
              </div>
              <button
                onClick={() => removeInjury(index)}
                className="cursor-pointer ml-2 rounded-lg p-1 text-muted hover:text-danger transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Events */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-text">Events</h2>
          </div>
          <button
            onClick={() => setShowEventModal(true)}
            className="cursor-pointer flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </button>
        </div>

        {events.length === 0 && (
          <p className="text-sm text-muted">No upcoming events.</p>
        )}

        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-xl bg-surface-light/50 px-3 py-2"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text">{event.name}</p>
                  <span className="text-xs font-semibold text-primary bg-primary/20 rounded-full px-2 py-0.5">
                    {event.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted">{event.event_date}</p>
                  <span className="text-xs text-muted">
                    {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteEvent(event.id)}
                className="cursor-pointer ml-2 rounded-lg p-1.5 text-muted hover:text-danger transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. Schedule */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text">Weekly Schedule</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-muted font-medium pb-2 pr-2" />
                {DAY_LABELS.map((day) => (
                  <th
                    key={day}
                    className="text-center text-muted font-medium pb-2 px-1 min-w-[36px]"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot}>
                  <td className="text-muted text-xs py-1 pr-2 whitespace-nowrap">
                    {TIME_SLOT_LABELS[slot]?.split(' ')[0] || slot}
                  </td>
                  {DAY_LABELS.map((_, dayIdx) => {
                    const available = isSlotAvailable(dayIdx, slot);
                    return (
                      <td key={dayIdx} className="text-center py-1 px-1">
                        <button
                          onClick={() => handleToggleScheduleSlot(dayIdx, slot)}
                          className={`cursor-pointer w-8 h-8 rounded-lg transition-colors ${
                            available
                              ? 'bg-primary/30 text-primary border border-primary/40'
                              : 'bg-surface-light text-muted border border-transparent'
                          }`}
                          title={`${DAY_LABELS[dayIdx]} ${slot}`}
                        >
                          {available ? '\u2713' : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 7. Mood History */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text">Recent Mood</h2>
        </div>

        {recentMood.length === 0 ? (
          <p className="text-sm text-muted">No mood entries yet. Log your first check-in from the Today tab.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentMood.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl bg-surface-light/50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted w-20">{entry.date}</span>
                  <span className="text-xs text-muted/60">
                    {entry.context === 'daily' ? 'Daily' : 'Pre-workout'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className={entry.mood >= 4 ? 'text-success' : entry.mood <= 2 ? 'text-danger' : 'text-warning'}>
                    M:{entry.mood}
                  </span>
                  <span className={entry.energy >= 4 ? 'text-success' : entry.energy <= 2 ? 'text-danger' : 'text-warning'}>
                    E:{entry.energy}
                  </span>
                  <span className={entry.sleep_quality >= 4 ? 'text-success' : entry.sleep_quality <= 2 ? 'text-danger' : 'text-warning'}>
                    S:{entry.sleep_quality}
                  </span>
                  {entry.stress && (
                    <span className={entry.stress <= 2 ? 'text-success' : entry.stress >= 4 ? 'text-danger' : 'text-warning'}>
                      St:{entry.stress}
                    </span>
                  )}
                  {entry.sleep_hours && (
                    <span className="text-muted">{entry.sleep_hours}h</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 8. Actions */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-text">Actions</h2>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            title="Switch Profile"
            variant="secondary"
            size="md"
            onClick={handleSwitchProfile}
          />
          <Button
            title="Sign Out"
            variant="outline"
            size="md"
            onClick={handleLogout}
          />
        </div>
      </Card>

      {/* Add Event Modal */}
      <Modal
        open={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setNewEventName('');
          setNewEventDate('');
          setNewEventType('other');
          setNewEventPriority('B');
        }}
        title="Add Event"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-muted mb-1 block">Event Name</label>
            <input
              type="text"
              placeholder="e.g., Spring Sprint Triathlon"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              className={inputClasses}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Date</label>
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Event Type</label>
            <select
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value as EventType)}
              className={selectClasses}
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Race Priority</label>
            <div className="flex gap-2">
              {priorityOptions.map((p) => (
                <button
                  key={p}
                  onClick={() => setNewEventPriority(p)}
                  className={`cursor-pointer flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
                    newEventPriority === p
                      ? 'bg-primary text-white'
                      : 'bg-surface-light text-muted'
                  }`}
                >
                  {p} Race
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              title="Cancel"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowEventModal(false);
                setNewEventName('');
                setNewEventDate('');
                setNewEventType('other');
                setNewEventPriority('B');
              }}
            />
            <Button
              title="Add Event"
              variant="primary"
              size="sm"
              onClick={handleAddEvent}
              disabled={!newEventName.trim() || !newEventDate}
            />
          </div>
        </div>
      </Modal>

      {/* Add Injury Modal */}
      <Modal
        open={showInjuryModal}
        onClose={() => {
          setShowInjuryModal(false);
          setNewInjuryArea('');
          setNewInjuryType('');
          setNewInjuryNotes('');
        }}
        title="Add Injury"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-muted mb-1 block">Area</label>
            <input
              type="text"
              placeholder="e.g., left_knee, right_shoulder"
              value={newInjuryArea}
              onChange={(e) => setNewInjuryArea(e.target.value)}
              className={inputClasses}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Type</label>
            <input
              type="text"
              placeholder="e.g., Torn ACL, Tendinitis"
              value={newInjuryType}
              onChange={(e) => setNewInjuryType(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Notes</label>
            <textarea
              placeholder="Additional notes about the injury..."
              value={newInjuryNotes}
              onChange={(e) => setNewInjuryNotes(e.target.value)}
              rows={2}
              className={`${inputClasses} resize-none`}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              title="Cancel"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowInjuryModal(false);
                setNewInjuryArea('');
                setNewInjuryType('');
                setNewInjuryNotes('');
              }}
            />
            <Button
              title="Add Injury"
              variant="primary"
              size="sm"
              onClick={handleAddInjury}
              disabled={!newInjuryArea.trim() || !newInjuryType.trim()}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
