import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant =
  | 'confirmed'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'active'
  | 'inactive'
  | 'owner'
  | 'staff'
  | 'customer'
  | 'free'
  | 'pro'
  | 'enterprise'
  | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  withDot?: boolean;
}

export function Badge({
  className,
  variant = 'neutral',
  withDot = true,
  children,
  ...props
}: BadgeProps) {
  const styles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
    confirmed: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    pending: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    completed: {
      bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      dot: 'bg-slate-500',
    },
    cancelled: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      text: 'text-rose-700 dark:text-rose-300',
      dot: 'bg-rose-500',
    },
    active: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    inactive: {
      bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      dot: 'bg-slate-400',
    },
    owner: {
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-300',
      dot: 'bg-purple-500',
    },
    staff: {
      bg: 'bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800',
      text: 'text-brand-700 dark:text-brand-300',
      dot: 'bg-brand-500',
    },
    customer: {
      bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
      text: 'text-sky-700 dark:text-sky-300',
      dot: 'bg-sky-500',
    },
    free: {
      bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      dot: 'bg-slate-500',
    },
    pro: {
      bg: 'bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800',
      text: 'text-brand-700 dark:text-brand-300',
      dot: 'bg-brand-500',
    },
    enterprise: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    neutral: {
      bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      dot: 'bg-slate-500',
    },
  };

  const current = styles[variant] || styles.neutral;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label font-medium border border-transparent',
        current.bg,
        current.text,
        className
      )}
      {...props}
    >
      {withDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', current.dot)} />}
      {children}
    </span>
  );
}
