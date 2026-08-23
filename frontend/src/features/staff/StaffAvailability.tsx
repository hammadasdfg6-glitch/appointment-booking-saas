import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Edit2, Check, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { availabilityApi } from '../../api/availability.api';
import { formatDayOfWeek, formatTime } from '../../lib/utils';
import { getErrorMessage } from '../../api/client';

interface DaySchedule {
  dayOfWeek: number; // 0=Sunday...6=Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  isConfigured: boolean;
}

const DEFAULT_WEEK: DaySchedule[] = [
  { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', isConfigured: false }, // Sun
  { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isConfigured: true },  // Mon
  { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isConfigured: true },  // Tue
  { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isConfigured: true },  // Wed
  { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isConfigured: true },  // Thu
  { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isConfigured: true },  // Fri
  { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', isConfigured: false }, // Sat
];

export function StaffAvailability() {
  const { user } = useAuth();
  const storageKey = `appointflow-avail-${user?.email || 'staff'}`;

  const [schedule, setSchedule] = useState<DaySchedule[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_WEEK;
  });

  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [startTimeInput, setStartTimeInput] = useState('09:00');
  const [endTimeInput, setEndTimeInput] = useState('17:00');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(schedule));
  }, [schedule, storageKey]);

  const handleStartEdit = (day: DaySchedule) => {
    setEditingDay(day.dayOfWeek);
    setStartTimeInput(day.startTime || '09:00');
    setEndTimeInput(day.endTime || '17:00');
  };

  const handleSaveDay = async (dayOfWeek: number) => {
    if (!startTimeInput || !endTimeInput) {
      toast.error('Please enter valid start and end times');
      return;
    }

    if (startTimeInput >= endTimeInput) {
      toast.error('End time must be after start time');
      return;
    }

    setIsSaving(true);
    try {
      // Call backend POST /availiability/
      try {
        await availabilityApi.addAvailability({
          dayOfWeek,
          startTime: startTimeInput,
          endTime: endTimeInput,
        });
      } catch (err: unknown) {
        // If 409 conflict or existing, attempt delete and recreate workaround
        const errObj = err as { status?: number; response?: { status?: number } };
        if (errObj.status === 409 || errObj.response?.status === 409) {
          if (user?._id) {
            try {
              await availabilityApi.deleteAvailability(user._id);
            } catch {
              // ignore delete error
            }
            await availabilityApi.addAvailability({
              dayOfWeek,
              startTime: startTimeInput,
              endTime: endTimeInput,
            });
          }
        } else {
          throw err;
        }
      }

      setSchedule((prev) =>
        prev.map((d) =>
          d.dayOfWeek === dayOfWeek
            ? { ...d, startTime: startTimeInput, endTime: endTimeInput, isConfigured: true }
            : d
        )
      );

      toast.success(`${formatDayOfWeek(dayOfWeek)} hours updated successfully!`);
      setEditingDay(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDay = async (dayOfWeek: number) => {
    setIsSaving(true);
    try {
      if (user?._id) {
        try {
          await availabilityApi.deleteAvailability(user._id);
        } catch {
          // ignore
        }
      }

      setSchedule((prev) =>
        prev.map((d) =>
          d.dayOfWeek === dayOfWeek ? { ...d, isConfigured: false } : d
        )
      );
      toast.success(`${formatDayOfWeek(dayOfWeek)} set to Off`);
      setEditingDay(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
          Weekly Working Hours
        </h1>
        <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
          Set your recurring working windows for each day of the week.
        </p>
      </div>

      {/* Backend Limitation Notice Banner */}
      <div className="p-4 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-body-sm text-brand-900 dark:text-brand-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-brand-800 dark:text-brand-300">
            Automated Nightly Slot Generation
          </p>
          <p className="text-caption text-brand-700 dark:text-brand-400 leading-relaxed">
            The server automatically pre-generates bookable slots for the next 7 days based on your weekly availability schedule. If you update your hours here, you can generate same-day slots immediately from the "Generate Slots" tab.
          </p>
        </div>
      </div>

      {/* 7 Day Cards Row/Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5">
        {schedule.map((day) => {
          const isEditing = editingDay === day.dayOfWeek;
          const dayName = formatDayOfWeek(day.dayOfWeek);

          return (
            <Card
              key={day.dayOfWeek}
              padding="sm"
              className={`flex flex-col justify-between transition-all ${
                day.isConfigured
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  : 'bg-slate-50/60 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-body-sm font-semibold text-slate-900 dark:text-slate-100">
                    {dayName.slice(0, 3)}
                  </span>
                  <span
                    className={`text-caption font-medium px-2 py-0.5 rounded-full ${
                      day.isConfigured
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {day.isConfigured ? 'Open' : 'Off'}
                  </span>
                </div>

                {isEditing ? (
                  <div className="mt-3 space-y-2.5">
                    <div>
                      <label className="text-caption text-slate-500 dark:text-slate-400">
                        Start (HH:mm)
                      </label>
                      <Input
                        type="time"
                        value={startTimeInput}
                        onChange={(e) => setStartTimeInput(e.target.value)}
                        className="h-8 text-caption px-2"
                      />
                    </div>
                    <div>
                      <label className="text-caption text-slate-500 dark:text-slate-400">
                        End (HH:mm)
                      </label>
                      <Input
                        type="time"
                        value={endTimeInput}
                        onChange={(e) => setEndTimeInput(e.target.value)}
                        className="h-8 text-caption px-2"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-center py-2">
                    {day.isConfigured ? (
                      <div className="space-y-1">
                        <div className="text-body-sm font-bold text-slate-800 dark:text-slate-200">
                          {formatTime(day.startTime)}
                        </div>
                        <div className="text-caption text-slate-400">to</div>
                        <div className="text-body-sm font-bold text-slate-800 dark:text-slate-200">
                          {formatTime(day.endTime)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-caption font-medium text-slate-400 dark:text-slate-500">
                        No working hours
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer inside Card */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                {isEditing ? (
                  <div className="flex flex-col gap-1.5">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      isLoading={isSaving}
                      onClick={() => handleSaveDay(day.dayOfWeek)}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-caption"
                      onClick={() => setEditingDay(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : day.isConfigured ? (
                  <div className="flex items-center justify-between gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-caption"
                      onClick={() => handleStartEdit(day)}
                      leftIcon={<Edit2 className="w-3 h-3" />}
                    >
                      Edit
                    </Button>
                    <button
                      onClick={() => handleRemoveDay(day.dayOfWeek)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                      title="Set to Off"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-caption"
                    onClick={() => handleStartEdit(day)}
                    leftIcon={<Plus className="w-3 h-3" />}
                  >
                    + Add
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
