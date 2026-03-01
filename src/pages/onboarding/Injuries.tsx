import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartPulse, Plus, X } from 'lucide-react';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAppStore } from '@/stores/useAppStore';
import type { Injury } from '@/types';
import Button from '@/components/ui/Button';

export default function Injuries() {
  const navigate = useNavigate();
  const { updateProfile } = useProfileStore();
  const { activeProfileId } = useAppStore();

  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [area, setArea] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  function addInjury() {
    const trimmedArea = area.trim();
    const trimmedType = type.trim();
    if (!trimmedArea || !trimmedType) return;
    if (injuries.some((inj) => inj.area.toLowerCase() === trimmedArea.toLowerCase())) return;

    setInjuries((prev) => [
      ...prev,
      { area: trimmedArea, type: trimmedType, notes: notes.trim(), recovered: false },
    ]);
    setArea('');
    setType('');
    setNotes('');
    setShowForm(false);
  }

  function removeInjury(index: number) {
    setInjuries((prev) => prev.filter((_, i) => i !== index));
  }

  function handleContinue() {
    if (!activeProfileId) return;
    updateProfile(activeProfileId, {
      injuries: JSON.stringify(injuries),
    });
    navigate('/onboarding/schedule');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer rounded-xl glass p-2.5 text-muted hover:text-text transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-sm text-muted text-center flex-1 pr-10">Step 6 of 7</p>
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

        {/* Current injuries */}
        {injuries.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {injuries.map((inj, index) => (
              <div
                key={inj.area}
                className="flex items-start justify-between rounded-xl glass px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-text">
                    {inj.area} — {inj.type}
                  </p>
                  {inj.notes && (
                    <p className="text-xs text-muted mt-0.5">{inj.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => removeInjury(index)}
                  className="cursor-pointer ml-2 text-muted hover:text-danger transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add injury form */}
        {showForm ? (
          <div className="flex flex-col gap-3 mb-8 rounded-xl glass p-4">
            <input
              type="text"
              placeholder="Area (e.g. left knee, lower back)"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
              autoFocus
            />
            <input
              type="text"
              placeholder="Type (e.g. torn ACL, tendinitis)"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
            />
            <input
              type="text"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
            />
            <div className="flex gap-2">
              <Button
                title="Add"
                variant="primary"
                size="sm"
                onClick={addInjury}
                disabled={!area.trim() || !type.trim()}
              />
              <Button
                title="Cancel"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setArea('');
                  setType('');
                  setNotes('');
                }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="cursor-pointer flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mb-8"
          >
            <Plus className="h-4 w-4" />
            Add an injury or limitation
          </button>
        )}

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
