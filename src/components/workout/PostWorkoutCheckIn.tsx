import { useState } from 'react';
import Button from '@/components/ui/Button';

interface PostWorkoutCheckInProps {
  plannedDuration: number;
  onSubmit: (rpe: number, actualDuration: number) => void;
  onSkip: () => void;
}

const RPE_LABELS: Record<number, string> = {
  1: 'Very Light',
  2: 'Light',
  3: 'Light-Moderate',
  4: 'Moderate',
  5: 'Hard',
  6: 'Hard',
  7: 'Very Hard',
  8: 'Very Hard',
  9: 'Near Max',
  10: 'Maximal',
};

export default function PostWorkoutCheckIn({
  plannedDuration,
  onSubmit,
  onSkip,
}: PostWorkoutCheckInProps) {
  const [rpe, setRpe] = useState(0);
  const [duration, setDuration] = useState(String(plannedDuration));

  return (
    <div className="glass rounded-2xl p-5 mx-4 mb-3 animate-fade-in">
      <h3 className="text-sm font-semibold mb-1">How did it go?</h3>
      <p className="text-xs text-muted mb-4">Rate your effort and actual duration.</p>

      {/* RPE scale */}
      <div className="mb-4">
        <label className="text-sm text-muted block mb-2">
          Perceived Exertion (RPE)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRpe(n)}
              className={`cursor-pointer h-10 w-10 rounded-full text-sm font-medium transition-all duration-200 ${
                rpe === n
                  ? n <= 3
                    ? 'bg-success text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                    : n <= 6
                      ? 'bg-warning text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : 'bg-danger text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  : 'bg-white/5 border border-white/10 text-muted hover:text-text hover:border-white/20'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {rpe > 0 && (
          <p className="text-xs text-muted mt-1.5">{RPE_LABELS[rpe]}</p>
        )}
      </div>

      {/* Actual duration */}
      <div className="mb-4">
        <label className="text-sm text-muted block mb-2">
          Actual Duration (minutes)
        </label>
        <input
          type="number"
          min="0"
          max="600"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="bg-white/5 border border-white/10 text-text rounded-lg px-3 py-2 w-28 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
        />
        {plannedDuration > 0 && parseInt(duration, 10) !== plannedDuration && (
          <span className="text-xs text-muted ml-2">
            (planned: {plannedDuration}min)
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          title="Save"
          variant="primary"
          size="sm"
          disabled={rpe === 0}
          onClick={() => onSubmit(rpe, parseInt(duration, 10) || plannedDuration)}
        />
        <Button
          title="Skip"
          variant="outline"
          size="sm"
          onClick={onSkip}
        />
      </div>
    </div>
  );
}
