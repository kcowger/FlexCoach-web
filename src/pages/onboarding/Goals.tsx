import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Target, X } from 'lucide-react';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAppStore } from '@/stores/useAppStore';
import { DEFAULT_GOALS } from '@/constants/defaults';
import Button from '@/components/ui/Button';

// Parse the default goals string into an array of individual goals
const PRESET_GOALS = DEFAULT_GOALS.split('. ')
  .map((g) => g.replace(/\.$/, '').trim())
  .filter(Boolean);

export default function Goals() {
  const navigate = useNavigate();
  const { updateProfile } = useProfileStore();
  const { activeProfileId } = useAppStore();

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  function addCustomGoal() {
    const trimmed = customGoal.trim();
    if (!trimmed || selectedGoals.includes(trimmed)) return;
    setSelectedGoals((prev) => [...prev, trimmed]);
    setCustomGoal('');
  }

  function removeGoal(goal: string) {
    setSelectedGoals((prev) => prev.filter((g) => g !== goal));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      addCustomGoal();
    }
  }

  function handleContinue() {
    if (!activeProfileId) return;
    updateProfile(activeProfileId, {
      goals: JSON.stringify(selectedGoals),
    });
    navigate('/onboarding/equipment');
  }

  // Goals that were custom-added (not in the preset list)
  const customGoals = selectedGoals.filter((g) => !PRESET_GOALS.includes(g));

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
        <p className="text-sm text-muted text-center flex-1 pr-10">Step 3 of 6</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto px-4 py-8 w-full">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="rounded-full bg-primary/20 p-4">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">What are your goals?</h1>
          <p className="text-muted text-center">
            Select the goals that matter to you, or add your own.
          </p>
        </div>

        {/* Preset goals */}
        <div className="flex flex-wrap gap-3 mb-6">
          {PRESET_GOALS.map((goal) => {
            const isSelected = selectedGoals.includes(goal);
            return (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium border transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/20 text-text'
                    : 'border-surface-light bg-surface text-muted hover:text-text'
                }`}
              >
                {goal}
              </button>
            );
          })}
        </div>

        {/* Custom goals display */}
        {customGoals.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {customGoals.map((goal) => (
              <span
                key={goal}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium border border-primary bg-primary/20 text-text"
              >
                {goal}
                <button
                  onClick={() => removeGoal(goal)}
                  className="cursor-pointer text-muted hover:text-text transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Custom goal input */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="Add a custom goal..."
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-surface text-text border border-surface-light rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <button
            onClick={addCustomGoal}
            disabled={!customGoal.trim()}
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
            disabled={selectedGoals.length === 0}
          />
        </div>
      </div>
    </div>
  );
}
