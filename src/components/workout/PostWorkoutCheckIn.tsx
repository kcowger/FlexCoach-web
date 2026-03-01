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
    <div className="bg-surface rounded-2xl p-4 mx-4 mb-3">
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
              className={`cursor-pointer h-9 w-9 rounded-full text-sm font-medium transition-colors ${
                rpe === n
                  ? n <= 3
                    ? 'bg-success text-white'
                    : n <= 6
                      ? 'bg-warning text-white'
                      : 'bg-danger text-white'
                  : 'bg-surface-light text-muted hover:text-text'
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
          className="bg-surface-light text-text rounded-lg px-3 py-2 w-28 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
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
