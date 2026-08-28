import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Sparkles, Calendar as CalendarIcon, Info, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useGenerateSlots } from '../../hooks/useSlots';
import { useAuth } from '../../hooks/useAuth';
import { SlotItem } from '../../types/api';
import { formatTime, formatDate } from '../../lib/utils';
import { getErrorMessage } from '../../api/client';

export function StaffGenerateSlots() {
  const { user } = useAuth();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [generatedSlots, setGeneratedSlots] = useState<SlotItem[]>([]);

  const generateSlotsMutation = useGenerateSlots();

  const handleGenerate = async () => {
    if (!selectedDate) {
      toast.error('Please choose a valid date');
      return;
    }

    try {
      const response = await generateSlotsMutation.mutateAsync({
        staffId: user?._id,
        date: selectedDate,
        duration: 30,
      });

      if (response.slots) {
        setGeneratedSlots(response.slots);
        toast.success(`Successfully generated ${response.slots.length} bookable slots!`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
          Generate Time Slots
        </h1>
        <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
          Manually create bookable appointment slots for a specific calendar date.
        </p>
      </div>

      {/* Informational Callout */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-body-sm text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Did you know?
          </p>
          <p className="text-caption text-slate-500 dark:text-slate-400 leading-relaxed">
            Slots for the next 7 days are generated automatically overnight according to your weekly availability. You usually only need manual slot generation for dates further out, or right after updating your hours.
          </p>
        </div>
      </div>

      {/* Generator Form Card */}
      <Card padding="lg">
        <Card.Header
          title="Slot Generation Generator"
          description="Choose a target date matching one of your active working days."
        />
        <Card.Body>
          <div className="space-y-4">
            <div>
              <Input
                label="Select Date"
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                leftAddon={<CalendarIcon className="w-4 h-4" />}
              />
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-400">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-2 py-0.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-slate-700 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
                  className="px-2 py-0.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-slate-700 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(format(addDays(new Date(), 3), 'yyyy-MM-dd'))}
                  className="px-2 py-0.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-slate-700 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  +3 Days
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={generateSlotsMutation.isPending}
                onClick={handleGenerate}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Generate Bookable Slots
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Generated Slots Preview */}
      {generatedSlots.length > 0 && (
        <Card padding="md">
          <Card.Header
            title={`Generated Slots for ${formatDate(selectedDate, 'MMMM d, yyyy')}`}
            description={`${generatedSlots.length} slots are now live for customers to book.`}
          />
          <Card.Body>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {generatedSlots.map((slot, i) => (
                <div
                  key={slot._id || i}
                  className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-body-sm font-medium flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(slot.startTime)}</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
