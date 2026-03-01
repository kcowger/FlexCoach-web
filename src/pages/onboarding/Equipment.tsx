import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Wrench } from 'lucide-react';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAppStore } from '@/stores/useAppStore';
import { DEFAULT_EQUIPMENT, EQUIPMENT_LABELS } from '@/constants/defaults';
import type { Equipment as EquipmentType } from '@/types';
import Button from '@/components/ui/Button';

export default function Equipment() {
  const navigate = useNavigate();
  const { updateProfile } = useProfileStore();
  const { activeProfileId } = useAppStore();

  // Initialize from defaults - all start as the default values
  const [equipment, setEquipment] = useState<EquipmentType>({ ...DEFAULT_EQUIPMENT });

  function toggleEquipment(key: string) {
    setEquipment((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleContinue() {
    if (!activeProfileId) return;
    updateProfile(activeProfileId, {
      equipment: JSON.stringify(equipment),
    });
    navigate('/onboarding/injuries');
  }

  const equipmentKeys = Object.keys(DEFAULT_EQUIPMENT);

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
        <p className="text-sm text-muted text-center flex-1 pr-10">Step 4 of 6</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto px-4 py-8 w-full">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="rounded-full bg-primary/20 p-4">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Available Equipment</h1>
          <p className="text-muted text-center">
            Toggle the equipment you have access to. This helps us tailor your training plan.
          </p>
        </div>

        {/* Equipment grid */}
        <div className="flex flex-wrap gap-3 mb-8">
          {equipmentKeys.map((key) => {
            const isOwned = equipment[key];
            const label = EQUIPMENT_LABELS[key] || key;
            return (
              <button
                key={key}
                onClick={() => toggleEquipment(key)}
                className={`cursor-pointer inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border transition-colors ${
                  isOwned
                    ? 'border-primary bg-primary/20 text-text'
                    : 'border-surface-light bg-surface text-muted hover:text-text'
                }`}
              >
                {isOwned && <Check className="h-4 w-4 text-primary" />}
                {label}
              </button>
            );
          })}
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
