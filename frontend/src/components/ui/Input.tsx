import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, id, leftAddon, rightAddon, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-label font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'h-10 w-full rounded-lg border bg-white px-3 text-body text-slate-900 transition-colors',
              'placeholder:text-slate-400',
              'focus-ring focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
              'dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500',
              'dark:disabled:bg-slate-800 dark:disabled:text-slate-600',
              leftAddon && 'pl-9',
              rightAddon && 'pr-9',
              error
                ? 'border-danger-500 text-danger-700 focus:border-danger-500 focus:ring-danger-500 dark:border-danger-500 dark:text-danger-500'
                : 'border-slate-300 dark:border-slate-700',
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center text-slate-400">
              {rightAddon}
            </div>
          )}
        </div>
        {error ? (
          <p id={errorId} className="text-caption text-danger-700 dark:text-danger-500 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-caption text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
