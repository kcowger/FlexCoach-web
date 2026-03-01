import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Target,
  Dumbbell,
  Heart,
  Calendar,
  Clock,
  Settings,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  createEvent,
  deleteEvent,
  upsertSchedulePreference,
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
  Equipment,
  Injury,
  ExperienceLevel,
  EventType,
  EventPriority,
  TimeSlot,
} from '@/types';

const inputClasses =
  'bg-surface text-text border border-surface-light rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary focus:outline-none';
const selectClasses =
  'bg-surface text-text border border-surface-light rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary focus:outline-none';

export default function ProfilePage() {
  const navigate = useNavigate();
  const pid = useAppStore((s) => s.activeProfileId)!;
  const { lock } = useAuthStore();
  const {
    profile,
    schedule,
    events,
    loadProfile,
    updateProfile,
    loadSchedule,
    loadEvents,
  } = useProfileStore();

  // Local state for editing
  const [name, setName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [goals, setGoals] = useState('');
  const [equipment, setEquipment] = useState<Equipment>({ ...DEFAULT_EQUIPMENT });
  const [injuries, setInjuries] = useState<Injury[]>([]);

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
  }, [pid, loadProfile, loadSchedule, loadEvents]);

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

  function handleLock() {
    lock();
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

      {/* 2. Goals */}
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

      {/* 7. Actions */}
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
            title="Lock App"
            variant="outline"
            size="md"
            onClick={handleLock}
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
