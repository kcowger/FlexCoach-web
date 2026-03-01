import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAppStore } from '@/stores/useAppStore';
import type { Sex, WeightUnit, HeightUnit } from '@/types';
import Button from '@/components/ui/Button';

export default function Basics() {
  const navigate = useNavigate();
  const { updateProfile } = useProfileStore();
  const { activeProfileId } = useAppStore();

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('imperial');
  const [sex, setSex] = useState<Sex | ''>('');

  function handleContinue() {
    if (!activeProfileId) return;

    const heightInCm =
      heightUnit === 'imperial'
        ? ((Number(heightFeet) || 0) * 12 + (Number(heightInches) || 0)) * 2.54
        : Number(heightCm) || undefined;

    updateProfile(activeProfileId, {
      age: Number(age) || undefined,
      weight: Number(weight) || undefined,
      weight_unit: weightUnit,
      height_cm: heightInCm || undefined,
      height_unit: heightUnit,
      sex: sex || undefined,
    });

    navigate('/onboarding/goals');
  }

  const sexOptions: { value: Sex; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Skip' },
  ];

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
        <p className="text-sm text-muted text-center flex-1 pr-10">Step 3 of 7</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto px-4 py-8 w-full">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="rounded-full bg-primary/20 p-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">About You</h1>
          <p className="text-muted text-center">
            Help us personalize your training. All fields are optional.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Age */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Age</label>
            <input
              type="number"
              placeholder="e.g. 30"
              min={13}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Weight</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={weightUnit === 'lbs' ? 'e.g. 170' : 'e.g. 77'}
                min={50}
                max={500}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 flex-1 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setWeightUnit(weightUnit === 'lbs' ? 'kg' : 'lbs')}
                className="cursor-pointer rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-medium text-muted hover:text-text transition-all duration-200 min-w-[60px]"
              >
                {weightUnit}
              </button>
            </div>
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Height</label>
            <div className="flex gap-2">
              {heightUnit === 'imperial' ? (
                <>
                  <input
                    type="number"
                    placeholder="ft"
                    min={3}
                    max={8}
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(e.target.value)}
                    className="bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 flex-1 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="in"
                    min={0}
                    max={11}
                    value={heightInches}
                    onChange={(e) => setHeightInches(e.target.value)}
                    className="bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 flex-1 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </>
              ) : (
                <input
                  type="number"
                  placeholder="e.g. 178"
                  min={100}
                  max={250}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 flex-1 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              )}
              <button
                type="button"
                onClick={() => setHeightUnit(heightUnit === 'imperial' ? 'metric' : 'imperial')}
                className="cursor-pointer rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-medium text-muted hover:text-text transition-all duration-200 min-w-[60px]"
              >
                {heightUnit === 'imperial' ? 'ft/in' : 'cm'}
              </button>
            </div>
          </div>

          {/* Sex */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Sex</label>
            <div className="grid grid-cols-4 gap-2">
              {sexOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSex(opt.value)}
                  className={`cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium border transition-colors ${
                    sex === opt.value
                      ? 'border-primary bg-primary/20 text-text'
                      : 'border-white/10 bg-white/5 text-muted hover:text-text'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Continue */}
        <div className="mt-auto pt-8">
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
