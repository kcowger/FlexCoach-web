import { useState } from 'react';
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
  onSubmit: (data: MoodCheckInData) => void;
}

const LABELS = ['', 'Low', '', 'OK', '', 'Great'];
const STRESS_LABELS = ['', 'Low', '', 'Moderate', '', 'High'];

function RatingRow({
  label,
  value,
  onChange,
  labels = LABELS,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  labels?: string[];
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted w-16">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`cursor-pointer h-9 w-9 rounded-full text-sm font-medium transition-colors ${
              value === n
                ? 'bg-primary text-white'
                : 'bg-surface-light text-muted hover:text-text'
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

  const allSet = mood > 0 && energy > 0 && sleep > 0;

  function handleSubmit() {
    const data: MoodCheckInData = { mood, energy, sleep };
    if (stress > 0) data.stress = stress;
    if (sleepHours) data.sleepHours = parseFloat(sleepHours);
    if (restingHr) data.restingHr = parseInt(restingHr, 10);
    if (weight) data.weight = parseFloat(weight);
    onSubmit(data);
  }

  return (
    <div className="bg-surface rounded-2xl p-4 mx-4 mb-3">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <div className="flex flex-col gap-3">
        <RatingRow label="Mood" value={mood} onChange={setMood} />
        <RatingRow label="Energy" value={energy} onChange={setEnergy} />
        <RatingRow label="Sleep" value={sleep} onChange={setSleep} />
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
            className="bg-surface-light text-text rounded-lg px-3 py-2 w-24 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <span className="text-xs text-muted/60">hrs slept</span>
        </div>

        {/* Optional fields behind toggle */}
        {!showMore ? (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="cursor-pointer text-xs text-primary hover:text-primary/80 text-left"
          >
            + Add resting HR or weight
          </button>
        ) : (
          <div className="flex flex-col gap-3 border-t border-surface-light pt-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted w-16">Rest HR</span>
              <input
                type="number"
                min="30"
                max="200"
                placeholder="e.g. 58"
                value={restingHr}
                onChange={(e) => setRestingHr(e.target.value)}
                className="bg-surface-light text-text rounded-lg px-3 py-2 w-24 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
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
                className="bg-surface-light text-text rounded-lg px-3 py-2 w-24 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <span className="text-xs text-muted/60">lbs</span>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4">
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
