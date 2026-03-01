import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAppStore } from '@/stores/useAppStore';
import { upsertSchedulePreference } from '@/storage/repository';
import { DAY_LABELS_FULL, TIME_SLOT_LABELS } from '@/constants/defaults';
import type { TimeSlot } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const TIME_SLOTS = Object.keys(TIME_SLOT_LABELS) as TimeSlot[];
const DURATION_OPTIONS = [30, 45, 60, 90, 120];

interface DayConfig {
  available: boolean;
  timeSlot: TimeSlot;
  duration: number;
}

function createDefaultDays(): DayConfig[] {
  return DAY_LABELS_FULL.map(() => ({
    available: true,
    timeSlot: 'morning' as TimeSlot,
    duration: 60,
  }));
}

export default function Schedule() {
  const navigate = useNavigate();
  const { updateProfile } = useProfileStore();
  const { activeProfileId } = useAppStore();

  const [days, setDays] = useState<DayConfig[]>(createDefaultDays);

  function updateDay(index: number, updates: Partial<DayConfig>) {
    setDays((prev) =>
      prev.map((day, i) => (i === index ? { ...day, ...updates } : day))
    );
  }

  function handleFinish() {
    if (!activeProfileId) return;

    // Save each day's schedule preference
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      upsertSchedulePreference(
        activeProfileId,
        i, // 0=Monday, 6=Sunday
        day.timeSlot,
        day.available,
        day.duration
      );
    }

    // Mark onboarding as complete
    updateProfile(activeProfileId, { onboarding_complete: 1 });
    navigate('/');
  }

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
        <p className="text-sm text-muted text-center flex-1 pr-10">Step 6 of 6</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto px-4 py-8 w-full">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="rounded-full bg-primary/20 p-4">
            <CalendarDays className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Your Weekly Schedule</h1>
          <p className="text-muted text-center">
            Set your availability for each day. We will schedule workouts
            around your preferred times.
          </p>
        </div>

        {/* Day rows */}
        <div className="flex flex-col gap-3 mb-8">
          {DAY_LABELS_FULL.map((dayName, index) => {
            const day = days[index];
            return (
              <Card key={dayName} className="!mx-0">
                {/* Day name + available toggle */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-text">{dayName}</span>
                  <button
                    onClick={() => updateDay(index, { available: !day.available })}
                    className={`cursor-pointer relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      day.available ? 'bg-primary' : 'bg-surface-light'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                        day.available ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {day.available && (
                  <div className="flex flex-col gap-3">
                    {/* Time slot selector */}
                    <div>
                      <p className="text-xs text-muted mb-1.5">Time Slot</p>
                      <div className="flex gap-2">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => updateDay(index, { timeSlot: slot })}
                            className={`cursor-pointer flex-1 rounded-lg px-2 py-1.5 text-xs font-medium border transition-colors ${
                              day.timeSlot === slot
                                ? 'border-primary bg-primary/20 text-text'
                                : 'border-surface-light bg-surface text-muted hover:text-text'
                            }`}
                          >
                            {TIME_SLOT_LABELS[slot]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration selector */}
                    <div>
                      <p className="text-xs text-muted mb-1.5">Max Duration</p>
                      <div className="flex gap-2">
                        {DURATION_OPTIONS.map((mins) => (
                          <button
                            key={mins}
                            onClick={() => updateDay(index, { duration: mins })}
                            className={`cursor-pointer flex-1 rounded-lg px-2 py-1.5 text-xs font-medium border transition-colors ${
                              day.duration === mins
                                ? 'border-primary bg-primary/20 text-text'
                                : 'border-surface-light bg-surface text-muted hover:text-text'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Finish */}
        <div className="mt-auto">
          <Button
            title="Finish Setup"
            variant="primary"
            size="lg"
            onClick={handleFinish}
          />
        </div>
      </div>
    </div>
  );
}
