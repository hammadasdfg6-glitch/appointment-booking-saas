import { useState } from 'react';
import {
  DollarSign,
  Calendar,
  Users,
  Briefcase,
  RotateCcw,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useRevenueStats } from '../../../hooks/useStats';
import { useStaff } from '../../../hooks/useStaff';
import { useServices } from '../../../hooks/useServices';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '../../../lib/utils';

export function RevenueExplorer() {
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter States (default to Today for immediate value)
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Queries
  const { data: staffList = [], isLoading: isLoadingStaff } = useStaff();
  const { data: servicesData, isLoading: isLoadingServices } = useServices(1, 100);
  const servicesList = servicesData?.services || [];

  const queryParams = {
    ...(selectedStaffId ? { staffId: selectedStaffId } : {}),
    ...(selectedServiceId ? { serviceId: selectedServiceId } : {}),
    ...(selectedDate ? { date: selectedDate } : {}),
  };

  const { data: revenueData, isLoading: isLoadingRevenue, isFetching } = useRevenueStats(queryParams);

  const totalAmount = revenueData?.totalAmmount ?? 0;

  // Selected names for badges
  const activeStaff = staffList.find((s) => s._id === selectedStaffId);
  const activeService = servicesList.find((s) => s._id === selectedServiceId);

  const handleResetFilters = () => {
    setSelectedStaffId('');
    setSelectedServiceId('');
    setSelectedDate(todayStr);
  };

  return (
    <Card padding="md" className="border-indigo-100 dark:border-indigo-950/80 shadow-xs">
      <Card.Header
        title="Revenue Intelligence & Breakdown"
        description="Filter and analyze verified paid revenue in real-time across staff, services, and dates."
        action={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Live Stripe Verified
            </span>
          </div>
        }
      />

      <Card.Body>
        {/* Filter Controls Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 pb-5 border-b border-slate-100 dark:border-slate-800">
          {/* 1. Staff Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Staff Provider</span>
            </label>
            <Select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              disabled={isLoadingStaff}
              className="text-xs"
            >
              <option value="">All Team Members</option>
              {staffList.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </Select>
          </div>

          {/* 2. Service Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              <span>Service Offering</span>
            </label>
            <Select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              disabled={isLoadingServices}
              className="text-xs"
            >
              <option value="">All Service Offerings</option>
              {servicesList.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name} (${service.price})
                </option>
              ))}
            </Select>
          </div>

          {/* 3. Date Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Date</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Live Calculation Output & Preset Shortcuts */}
        <div className="pt-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Revenue Stat Display */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-brand-600 text-white flex items-center justify-center shadow-md shrink-0">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Filtered Paid Revenue
                </span>
                {isFetching && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600 dark:text-brand-400" />
                )}
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                {isLoadingRevenue ? (
                  <span className="text-slate-300 dark:text-slate-700 animate-pulse">$--.--</span>
                ) : totalAmount === 0 ? (
                  '$0.00'
                ) : (
                  formatCurrency(totalAmount)
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Chips & Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
            {activeStaff && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Staff: <strong>{activeStaff.name}</strong>
              </span>
            )}

            {activeService && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Service: <strong>{activeService.name}</strong>
              </span>
            )}

            {selectedDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Date: <strong>{selectedDate}</strong>
              </span>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
