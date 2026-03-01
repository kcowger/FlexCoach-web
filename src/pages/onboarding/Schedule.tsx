import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Plus, X } from 'lucide-react';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAppStore } from '@/stores/useAppStore';
import { upsertSchedulePreference } from '@/storage/repository';
import { DAY_LABELS_FULL, TIME_SLOT_LABELS, DURATION_OPTIONS } from '@/constants/defaults';
import type { TimeSlot } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const TIME_SLOTS = Object.keys(TIME_SLOT_LABELS) as TimeSlot[];

interface SlotConfig {
  timeSlot: TimeSlot;
  duration: number;
}

interface DayConfig {
  available: boolean;
  slots: SlotConfig[];
}

function createDefaultDays(): DayConfig[] {
  return DAY_LABELS_FULL.map((_, i) => {
    // Defaults: Mon/Wed/Fri morning, Tue/Thu evening, Sat/Sun rest
    if (i <= 4) {
      return {
        available: true,
        slots: [{ timeSlot: (i % 2 === 0 ? 'morning' : 'evening') as TimeSlot, duration: 60 }],
      };
    }
    return { available: false, slots: [] };
  });
}

export default function Schedule() {
  const navigate = useNavigate();
  const { updateProfile } = useProfileStore();
  const { activeProfileId } = useAppStore();

  const [days, setDays] = useState<DayConfig[]>(createDefaultDays);

  function toggleDay(index: number) {
    setDays((prev) =>
      prev.map((day, i) => {
        if (i !== index) return day;
        if (day.available) {
          return { available: false, slots: [] };
        }
        return { available: true, slots: [{ timeSlot: 'morning', duration: 60 }] };
      })
    );
  }

  function addSlot(dayIndex: number) {
    setDays((prev) =>
      prev.map((day, i) => {
        if (i !== dayIndex) return day;
        const usedSlots = day.slots.map((s) => s.timeSlot);
        const nextSlot = TIME_SLOTS.find((s) => !usedSlots.includes(s));
        if (!nextSlot) return day;
        return { ...day, slots: [...day.slots, { timeSlot: nextSlot, duration: 60 }] };
      })
    );
  }

  function removeSlot(dayIndex: number, slotIndex: number) {
    setDays((prev) =>
      prev.map((day, i) => {
        if (i !== dayIndex) return day;
        const newSlots = day.slots.filter((_, si) => si !== slotIndex);
        if (newSlots.length === 0) return { available: false, slots: [] };
        return { ...day, slots: newSlots };
      })
    );
  }

  function updateSlotTime(dayIndex: number, slotIndex: number, timeSlot: TimeSlot) {
    setDays((prev) =>
      prev.map((day, i) => {
        if (i !== dayIndex) return day;
        const newSlots = [...day.slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], timeSlot };
        return { ...day, slots: newSlots };
      })
    );
  }

  function updateSlotDuration(dayIndex: number, slotIndex: number, duration: number) {
    setDays((prev) =>
      prev.map((day, i) => {
        if (i !== dayIndex) return day;
        const newSlots = [...day.slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], duration };
        return { ...day, slots: newSlots };
      })
    );
  }

  function getAvailableTimeSlots(dayIndex: number, currentSlotIndex: number): TimeSlot[] {
    const usedSlots = days[dayIndex].slots
      .filter((_, i) => i !== currentSlotIndex)
      .map((s) => s.timeSlot);
    return TIME_SLOTS.filter((s) => !usedSlots.includes(s));
  }

  function handleFinish() {
    if (!activeProfileId) return;

    // Clear all slots first
    for (let i = 0; i < days.length; i++) {
      for (const slot of TIME_SLOTS) {
        upsertSchedulePreference(activeProfileId, i, slot, false, 60);
      }
    }

    // Save active slots
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (day.available) {
        for (const slot of day.slots) {
          upsertSchedulePreference(activeProfileId, i, slot.timeSlot, true, slot.duration);
        }
      }
    }

    // Mark onboarding as complete
    updateProfile(activeProfileId, { onboarding_complete: 1 });
    navigate('/');
  }

  const activeDays = days.filter((d) => d.available).length;

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
        <p className="text-sm text-muted text-center flex-1 pr-10">Step 7 of 7</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto px-4 py-8 w-full">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="rounded-full bg-primary/20 p-4">
            <CalendarDays className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Your Weekly Schedule</h1>
          <p className="text-muted text-center">
            Set your available training windows. You can have multiple time slots
            per day (e.g., morning swim + evening strength).
          </p>
        </div>

        {/* Day rows */}
        <div className="flex flex-col gap-3 mb-4">
          {DAY_LABELS_FULL.map((dayName, index) => {
            const day = days[index];
            const canAddSlot = day.available && day.slots.length < 3;

            return (
              <Card key={dayName} className="!mx-0">
                {/* Day name + available toggle */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-text">{dayName}</span>
                  <button
                    onClick={() => toggleDay(index)}
                    className={`cursor-pointer relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      day.available ? 'bg-primary' : 'bg-white/10'
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
                  <div className="flex flex-col gap-2">
                    {day.slots.map((slot, slotIdx) => {
                      const availableSlots = getAvailableTimeSlots(index, slotIdx);
                      return (
                        <div
                          key={slotIdx}
                          className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2"
                        >
                          {/* Time slot chips */}
                          <div className="flex gap-1 flex-1">
                            {availableSlots.map((ts) => (
                              <button
                                key={ts}
                                onClick={() => updateSlotTime(index, slotIdx, ts)}
                                className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  slot.timeSlot === ts
                                    ? 'border-primary bg-primary/20 text-text border'
                                    : 'border-white/10 bg-white/5 text-muted hover:text-text border'
                                }`}
                              >
                                {TIME_SLOT_LABELS[ts]}
                              </button>
                            ))}
                          </div>

                          {/* Duration selector */}
                          <div className="flex gap-1">
                            {DURATION_OPTIONS.map((mins) => (
                              <button
                                key={mins}
                                onClick={() => updateSlotDuration(index, slotIdx, mins)}
                                className={`cursor-pointer px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  slot.duration === mins
                                    ? 'border-primary bg-primary/20 text-text border'
                                    : 'border-white/10 bg-white/5 text-muted hover:text-text border'
                                }`}
                              >
                                {mins}m
                              </button>
                            ))}
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={() => removeSlot(index, slotIdx)}
                            className="cursor-pointer p-1 text-muted hover:text-danger transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Add slot button */}
                    {canAddSlot && (
                      <button
                        onClick={() => addSlot(index)}
                        className="cursor-pointer flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors py-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add time slot
                      </button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <p className="text-muted text-sm text-center mb-8">
          {activeDays} training day{activeDays !== 1 ? 's' : ''} per week
        </p>

        {/* Finish */}
        <div className="mt-auto">
          <Button
            title="Finish Setup"
            variant="primary"
            size="lg"
            onClick={handleFinish}
            disabled={activeDays === 0}
          />
        </div>
      </div>
    </div>
  );
}
