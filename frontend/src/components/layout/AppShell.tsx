import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { apiClient } from '../../api/client';
import { AlertCircle } from 'lucide-react';

export function AppShell({ title }: { title?: string }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isApiHealthy, setIsApiHealthy] = useState<boolean | null>(null);
  const location = useLocation();

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Initial API health check
  useEffect(() => {
    let mounted = true;
    apiClient
      .get('/health')
      .then(() => {
        if (mounted) setIsApiHealthy(true);
      })
      .catch(() => {
        if (mounted) setIsApiHealthy(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950 flex flex-col">
      {/* API Unreachable warning banner */}
      {isApiHealthy === false && (
        <div className="bg-amber-500 text-slate-950 text-caption font-medium py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>
            Connecting to AppointFlow API... Make sure the backend server is running on port 5052.
          </span>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:pl-60 min-w-0">
          <TopBar
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
            title={title}
          />
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
