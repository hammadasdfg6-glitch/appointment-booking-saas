import React from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string | number; // percentage e.g. "12.5" or "+12%"
    isPositive: boolean;
    comparisonText: string; // e.g. "vs last week"
  };
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, trend, icon: Icon, className }: StatCardProps) {
  return (
    <Card padding="sm" className={cn('p-5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-caption font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-[28px] leading-tight font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </div>

        {trend && (
          <div
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium shrink-0',
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
            )}
            title={trend.comparisonText}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{typeof trend.value === 'number' ? `${trend.value.toFixed(1)}%` : `${trend.value}%`}</span>
          </div>
        )}
      </div>

      {trend?.comparisonText && (
        <div className="mt-1 text-caption text-slate-400 dark:text-slate-500">
          {trend.comparisonText}
        </div>
      )}
    </Card>
  );
}
