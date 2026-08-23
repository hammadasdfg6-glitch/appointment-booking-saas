import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StepItem {
  id: number;
  label: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile view: text + thin progress bar */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between text-body-sm mb-2">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {steps.find((s) => s.id === currentStep)?.label}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-brand-600 dark:bg-brand-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Desktop view: numbered circles connected by line */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-brand-600 dark:bg-brand-500 transition-all duration-300 ease-out -z-0"
          style={{ width: `${progressPercent}%` }}
        />

        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = isCompleted && !!onStepClick;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative z-10 select-none"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.id)}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-medium text-caption transition-all focus-ring',
                  isCompleted
                    ? 'bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500'
                    : isCurrent
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-950 dark:bg-brand-500'
                    : 'bg-white border-2 border-slate-300 text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400',
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                )}
                aria-label={`${step.label} (${isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Upcoming'})`}
              >
                {isCompleted ? <Check className="w-4 h-4" strokeWidth={2.5} /> : step.id}
              </button>
              <span
                className={cn(
                  'text-caption mt-2 font-medium text-center whitespace-nowrap',
                  isCurrent
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : isCompleted
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
