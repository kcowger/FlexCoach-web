import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Plus, X, Wrench } from 'lucide-react';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAppStore } from '@/stores/useAppStore';
import { SUGGESTED_EQUIPMENT } from '@/constants/defaults';
import type { Equipment as EquipmentType } from '@/types';
import Button from '@/components/ui/Button';

export default function Equipment() {
  const navigate = useNavigate();
  const { updateProfile } = useProfileStore();
  const { activeProfileId } = useAppStore();

  const [equipment, setEquipment] = useState<EquipmentType>({});
  const [customItem, setCustomItem] = useState('');

  function toggleEquipment(name: string) {
    setEquipment((prev) => {
      const updated = { ...prev };
      if (updated[name]) {
        delete updated[name];
      } else {
        updated[name] = true;
      }
      return updated;
    });
  }

  function addCustomItem() {
    const trimmed = customItem.trim();
    if (!trimmed || equipment[trimmed]) return;
    setEquipment((prev) => ({ ...prev, [trimmed]: true }));
    setCustomItem('');
  }

  function removeCustomItem(name: string) {
    setEquipment((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') addCustomItem();
  }

  function handleContinue() {
    if (!activeProfileId) return;
    updateProfile(activeProfileId, {
      equipment: JSON.stringify(equipment),
    });
    navigate('/onboarding/injuries');
  }

  // Custom items are those not in the suggested list
  const customItems = Object.keys(equipment).filter(
    (k) => equipment[k] && !SUGGESTED_EQUIPMENT.includes(k)
  );

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
        <p className="text-sm text-muted text-center flex-1 pr-10">Step 5 of 7</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto px-4 py-8 w-full">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="rounded-full bg-primary/20 p-4">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Available Equipment</h1>
          <p className="text-muted text-center">
            Select what you have access to, or add your own.
          </p>
        </div>

        {/* Suggested equipment */}
        <div className="flex flex-wrap gap-3 mb-4">
          {SUGGESTED_EQUIPMENT.map((name) => {
            const isSelected = !!equipment[name];
            return (
              <button
                key={name}
                onClick={() => toggleEquipment(name)}
                className={`cursor-pointer inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/20 text-text'
                    : 'border-white/10 bg-white/5 text-muted hover:text-text'
                }`}
              >
                {isSelected && <Check className="h-4 w-4 text-primary" />}
                {name}
              </button>
            );
          })}
        </div>

        {/* Custom equipment display */}
        {customItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {customItems.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium border border-primary bg-primary/20 text-text"
              >
                {name}
                <button
                  onClick={() => removeCustomItem(name)}
                  className="cursor-pointer text-muted hover:text-text transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Custom item input */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="Add custom equipment..."
            value={customItem}
            onChange={(e) => setCustomItem(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
          />
          <button
            onClick={addCustomItem}
            disabled={!customItem.trim()}
            className="cursor-pointer rounded-xl bg-white/5 border border-white/10 px-3 text-muted hover:text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
