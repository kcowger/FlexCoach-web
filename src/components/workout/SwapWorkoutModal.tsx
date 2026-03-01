import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Workout, Discipline } from '@/types';
import { generateSwapSuggestion, type SwapSuggestion } from '@/services/swapGenerator';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDuration } from '@/utils/date';
import { formatDistance } from '@/utils/distance';
import type { DistanceUnit } from '@/types';

const QUICK_REASONS = [
  'Facility closed',
  'Equipment unavailable',
  'Feeling fatigued',
  'Minor injury / soreness',
  'Time constraints',
  'Weather conditions',
];

type SwapStep = 'reason' | 'loading' | 'preview' | 'error';

interface SwapWorkoutModalProps {
  open: boolean;
  workout: Workout;
  pid: string;
  onClose: () => void;
  onAccept: (changes: {
    discipline: string;
    title: string;
    durationMinutes: number;
    details: string;
    distance?: number;
    distanceUnit?: string;
  }) => void;
}

export default function SwapWorkoutModal({
  open,
  workout,
  pid,
  onClose,
  onAccept,
}: SwapWorkoutModalProps) {
  const [step, setStep] = useState<SwapStep>('reason');
  const [reason, setReason] = useState('');
  const [suggestion, setSuggestion] = useState<SwapSuggestion | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setStep('reason');
      setReason('');
      setSuggestion(null);
      setError('');
    }
  }, [open]);

  async function handleFindAlternative() {
    const trimmed = reason.trim();
    if (!trimmed) return;

    setStep('loading');
    try {
      const result = await generateSwapSuggestion(pid, workout, trimmed);
      setSuggestion(result);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate alternative');
      setStep('error');
    }
  }

  function handleAccept() {
    if (!suggestion) return;
    onAccept({
      discipline: suggestion.discipline,
      title: suggestion.title,
      durationMinutes: suggestion.durationMinutes,
      details: suggestion.details,
      distance: suggestion.distance ?? undefined,
      distanceUnit: suggestion.distanceUnit ?? undefined,
    });
  }

  function handleTryAgain() {
    setStep('reason');
    setSuggestion(null);
    setError('');
  }

  function stepTitle(): string {
    switch (step) {
      case 'reason':
        return 'Swap Workout';
      case 'loading':
        return 'Finding Alternative...';
      case 'preview':
        return 'Suggested Alternative';
      case 'error':
        return 'Swap Workout';
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={stepTitle()}>
      {/* Step: Reason */}
      {step === 'reason' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Why do you need to swap this workout?
          </p>

          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  reason === r
                    ? 'bg-warning text-white'
                    : 'bg-white/5 border border-white/10 text-muted hover:text-text'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Or type a custom reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFindAlternative();
            }}
            className="bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
          />

          <div className="flex gap-3 justify-end">
            <Button
              title="Cancel"
              variant="outline"
              size="sm"
              onClick={onClose}
            />
            <Button
              title="Find Alternative"
              variant="primary"
              size="sm"
              onClick={handleFindAlternative}
              disabled={!reason.trim()}
            />
          </div>
        </div>
      )}

      {/* Step: Loading */}
      {step === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
          <p className="text-sm text-muted">
            Analyzing your week and finding a suitable replacement...
          </p>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && suggestion && (
        <div className="flex flex-col gap-4">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge discipline={suggestion.discipline as Discipline} size="sm" />
            </div>
            <h3 className="text-base font-semibold text-text mb-1">
              {suggestion.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted mb-3">
              <span>{formatDuration(suggestion.durationMinutes)}</span>
              {suggestion.distance != null && suggestion.distanceUnit && (
                <>
                  <span className="text-white/10">|</span>
                  <span>{formatDistance(suggestion.distance, suggestion.distanceUnit as DistanceUnit)}</span>
                </>
              )}
            </div>
            <p className="text-sm text-text whitespace-pre-wrap">
              {suggestion.details}
            </p>
            {suggestion.why && (
              <p className="text-xs text-muted mt-3 italic">
                {suggestion.why}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              title="Try Again"
              variant="outline"
              size="sm"
              onClick={handleTryAgain}
            />
            <Button
              title="Accept"
              variant="primary"
              size="sm"
              onClick={handleAccept}
            />
          </div>
        </div>
      )}

      {/* Step: Error */}
      {step === 'error' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-danger/15 border border-danger/20 px-4 py-3">
            <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              title="Cancel"
              variant="outline"
              size="sm"
              onClick={onClose}
            />
            <Button
              title="Try Again"
              variant="primary"
              size="sm"
              onClick={handleTryAgain}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
