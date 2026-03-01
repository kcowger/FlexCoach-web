import { useState } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface MoodCheckInData {
  mood: number;
  energy: number;
  sleep: number;
  sleepHours?: number;
  stress?: number;
  restingHr?: number;
  weight?: number;
}

interface MoodCheckInProps {
  title?: string;
  collapsible?: boolean;
  error?: string | null;
  onSubmit: (data: MoodCheckInData) => void;
}

const LABELS = ['', 'Low', '', 'OK', '', 'Great'];
const STRESS_LABELS = ['', 'Low', '', 'Moderate', '', 'High'];

function RatingRow({
  label,
  value,
  onChange,
  labels = LABELS,
  required = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  labels?: string[];
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted w-16">
        {label}
        {required && <span className="text-primary ml-0.5">*</span>}
      </span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`cursor-pointer h-10 w-10 rounded-full text-sm font-medium transition-all duration-200 ${
              value === n
                ? 'bg-primary text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'bg-white/5 border border-white/10 text-muted hover:text-text hover:border-white/20'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="text-xs text-muted/60 w-12">
        {value > 0 ? labels[value] : ''}
      </span>
    </div>
  );
}

export default function MoodCheckIn({
  title = 'How are you feeling today?',
  collapsible = false,
  error: externalError,
  onSubmit,
}: MoodCheckInProps) {
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [stress, setStress] = useState(0);
  const [sleepHours, setSleepHours] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [restingHr, setRestingHr] = useState('');
  const [weight, setWeight] = useState('');
  const [expanded, setExpanded] = useState(!collapsible);
  const [localError, setLocalError] = useState('');

  const allSet = mood > 0 && energy > 0 && sleep > 0;
  const displayError = externalError || localError;

  function handleSubmit() {
    console.log('[MoodCheckIn] handleSubmit called, allSet:', allSet);
    if (!allSet) return;

    setLocalError('');
    const data: MoodCheckInData = { mood, energy, sleep };
    if (stress > 0) data.stress = stress;
    if (sleepHours) data.sleepHours = parseFloat(sleepHours);
    if (restingHr) data.restingHr = parseInt(restingHr, 10);
    if (weight) data.weight = parseFloat(weight);

    try {
      onSubmit(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save check-in. Please try again.';
      console.error('[MoodCheckIn] onSubmit error:', err);
      setLocalError(msg);
    }
  }

  const inputClasses =
    'bg-white/5 border border-white/10 text-text rounded-lg px-3 py-2 w-24 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all';

  if (collapsible && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="cursor-pointer glass rounded-2xl px-5 py-3 mx-4 mb-3 flex items-center justify-between w-[calc(100%-2rem)] animate-fade-in hover:bg-white/[0.06] transition-all duration-200"
      >
        <span className="text-sm text-muted">{title}</span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>
    );
  }

  return (
    <div className="glass rounded-2xl p-5 mx-4 mb-3 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {collapsible && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="cursor-pointer text-xs text-muted hover:text-text transition-colors"
          >
            Collapse
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <RatingRow label="Mood" value={mood} onChange={setMood} required />
        <RatingRow label="Energy" value={energy} onChange={setEnergy} required />
        <RatingRow label="Sleep" value={sleep} onChange={setSleep} required />
        <RatingRow label="Stress" value={stress} onChange={setStress} labels={STRESS_LABELS} />

        {/* Sleep hours inline */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted w-16">Hours</span>
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            placeholder="e.g. 7.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            className={inputClasses}
          />
          <span className="text-xs text-muted/60">hrs slept</span>
        </div>

        {/* Optional fields behind toggle */}
        {!showMore ? (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="cursor-pointer text-xs text-primary hover:text-primary-light text-left transition-colors"
          >
            + Add resting HR or weight
          </button>
        ) : (
          <div className="flex flex-col gap-3 border-t border-white/5 pt-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted w-16">Rest HR</span>
              <input
                type="number"
                min="30"
                max="200"
                placeholder="e.g. 58"
                value={restingHr}
                onChange={(e) => setRestingHr(e.target.value)}
                className={inputClasses}
              />
              <span className="text-xs text-muted/60">bpm</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted w-16">Weight</span>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 165"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={inputClasses}
              />
              <span className="text-xs text-muted/60">lbs</span>
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {displayError && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-danger/15 border border-danger/20 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-danger flex-shrink-0" />
          <p className="text-xs text-danger">{displayError}</p>
        </div>
      )}

      <div className="mt-4">
        {!allSet && (
          <p className="text-xs text-muted mb-2 text-center">
            Select mood, energy, and sleep to continue
          </p>
        )}
        <Button
          title="Log Check-in"
          variant="primary"
          size="sm"
          disabled={!allSet}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
}
