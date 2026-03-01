import { useState } from 'react';
import Button from '@/components/ui/Button';

interface MoodCheckInProps {
  title?: string;
  onSubmit: (mood: number, energy: number, sleep: number) => void;
}

const LABELS = ['', 'Low', '', 'OK', '', 'Great'];

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
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
        {value > 0 ? LABELS[value] : ''}
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

  const allSet = mood > 0 && energy > 0 && sleep > 0;

  return (
    <div className="bg-surface rounded-2xl p-4 mx-4 mb-3">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <div className="flex flex-col gap-3">
        <RatingRow label="Mood" value={mood} onChange={setMood} />
        <RatingRow label="Energy" value={energy} onChange={setEnergy} />
        <RatingRow label="Sleep" value={sleep} onChange={setSleep} />
      </div>
      <div className="mt-4">
        <Button
          title="Log Check-in"
          variant="primary"
          size="sm"
          disabled={!allSet}
          onClick={() => onSubmit(mood, energy, sleep)}
        />
      </div>
    </div>
  );
}
