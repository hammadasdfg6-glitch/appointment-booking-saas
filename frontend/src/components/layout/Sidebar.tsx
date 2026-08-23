import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Sparkles,
  Users,
  Briefcase,
  UserCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
  const { user, role } = useAuth();

  const navLinksByRole = {
    owner: [
      { to: '/dashboard/owner', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/dashboard/owner/services', label: 'Services', icon: Briefcase },
      { to: '/dashboard/owner/team', label: 'Team', icon: Users },
      { to: '/dashboard/owner/bookings', label: 'Bookings', icon: Calendar },
      { to: '/dashboard/owner/profile', label: 'Settings', icon: UserIcon },
    ],
    staff: [
      { to: '/dashboard/staff', label: 'My Schedule', icon: Calendar, end: true },
      { to: '/dashboard/staff/availability', label: 'Weekly Availability', icon: Clock },
      { to: '/dashboard/staff/slots', label: 'Generate Slots', icon: Sparkles },
      { to: '/dashboard/staff/profile', label: 'Profile', icon: UserIcon },
    ],
    customer: [
      { to: '/dashboard/customer', label: 'My Bookings', icon: Calendar, end: true },
      { to: '/book', label: 'Book Appointment', icon: Sparkles },
      { to: '/dashboard/customer/profile', label: 'Profile', icon: UserIcon },
    ],
  };

  const currentNav = (role && navLinksByRole[role]) || [];

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
        <NavLink to="/" className="flex items-center gap-2.5 focus-ring rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white font-bold shadow-sm">
            A
          </div>
          <span className="text-h3 font-bold tracking-tight text-slate-900 dark:text-slate-100">
            AppointFlow
          </span>
        </NavLink>
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Role Badge Strip */}
      {user && (
        <div className="px-6 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="truncate">
            <p className="text-body-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {user.name}
            </p>
            <p className="text-caption text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
          </div>
          <Badge variant={role || 'neutral'} className="capitalize shrink-0">
            {role}
          </Badge>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {currentNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm font-medium transition-all focus-ring',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-caption text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Online</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full shadow-xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
