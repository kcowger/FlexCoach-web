import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, HeartPulse, Plus, X } from 'lucide-react';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAppStore } from '@/stores/useAppStore';
import { DEFAULT_INJURIES } from '@/constants/defaults';
import type { Injury } from '@/types';
import Button from '@/components/ui/Button';

export default function Injuries() {
  const navigate = useNavigate();
  const { updateProfile } = useProfileStore();
  const { activeProfileId } = useAppStore();

  // Initialize from defaults - injuries start as inactive (user must toggle on)
  const [injuries, setInjuries] = useState<(Injury & { enabled: boolean })[]>(
    DEFAULT_INJURIES.map((inj) => ({ ...inj, enabled: false }))
  );
  const [customArea, setCustomArea] = useState('');

  function toggleInjury(index: number) {
    setInjuries((prev) =>
      prev.map((inj, i) =>
        i === index ? { ...inj, enabled: !inj.enabled } : inj
      )
    );
  }

  function addCustomInjury() {
    const trimmed = customArea.trim();
    if (!trimmed) return;

    // Check for duplicate
    if (injuries.some((inj) => inj.area.toLowerCase() === trimmed.toLowerCase())) return;

    setInjuries((prev) => [
      ...prev,
      {
        area: trimmed,
        type: 'General',
        notes: '',
        recovered: false,
        enabled: true,
      },
    ]);
    setCustomArea('');
  }

  function removeCustomInjury(index: number) {
    setInjuries((prev) => prev.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      addCustomInjury();
    }
  }

  function handleContinue() {
    if (!activeProfileId) return;

    // Only save enabled injuries
    const activeInjuries: Injury[] = injuries
      .filter((inj) => inj.enabled)
      .map(({ area, type, notes, recovered }) => ({ area, type, notes, recovered }));

    updateProfile(activeProfileId, {
      injuries: JSON.stringify(activeInjuries),
    });
    navigate('/onboarding/schedule');
  }

  // Separate preset vs custom
  const presetAreas = DEFAULT_INJURIES.map((inj) => inj.area);
  const customInjuries = injuries.filter((inj) => !presetAreas.includes(inj.area));

  return (
    <div className="bg-background text-text min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer rounded-xl bg-surface p-2.5 text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-sm text-muted text-center flex-1 pr-10">Step 5 of 6</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto px-4 py-8 w-full">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="rounded-full bg-primary/20 p-4">
            <HeartPulse className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Any injuries or limitations?</h1>
          <p className="text-muted text-center">
            Let us know about any injuries so we can adapt your training plan accordingly.
          </p>
        </div>

        {/* Preset injuries */}
        <div className="flex flex-wrap gap-3 mb-4">
          {injuries
            .map((inj, index) => ({ inj, index }))
            .filter(({ inj }) => presetAreas.includes(inj.area))
            .map(({ inj, index }) => (
              <button
                key={inj.area}
                onClick={() => toggleInjury(index)}
                className={`cursor-pointer inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border transition-colors ${
                  inj.enabled
                    ? 'border-primary bg-primary/20 text-text'
                    : 'border-surface-light bg-surface text-muted hover:text-text'
                }`}
              >
                {inj.enabled && <Check className="h-4 w-4 text-primary" />}
                <span>{inj.area.replace(/_/g, ' ')} - {inj.type}</span>
              </button>
            ))}
        </div>

        {/* Custom injuries */}
        {customInjuries.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {customInjuries.map((inj) => {
              const index = injuries.indexOf(inj);
              return (
                <span
                  key={inj.area}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium border border-primary bg-primary/20 text-text"
                >
                  {inj.area}
                  <button
                    onClick={() => removeCustomInjury(index)}
                    className="cursor-pointer text-muted hover:text-text transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Custom injury input */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="Add a custom injury or limitation..."
            value={customArea}
            onChange={(e) => setCustomArea(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-surface text-text border border-surface-light rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <button
            onClick={addCustomInjury}
            disabled={!customArea.trim()}
            className="cursor-pointer rounded-xl bg-surface border border-surface-light px-3 text-muted hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Continue */}
        <div className="mt-auto">
          <Button
            title="Continue"
            variant="primary"
            size="lg"
            onClick={handleContinue}
          />
        </div>
      </div>
    </div>
  );
}
