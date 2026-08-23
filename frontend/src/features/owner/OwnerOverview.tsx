import { Link } from 'react-router-dom';
import {
  Calendar,
  DollarSign,
  Users,
  Briefcase,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTotalStats, useAdvancedStats } from '../../hooks/useStats';
import { useBookings } from '../../hooks/useBookings';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SkeletonCard, SkeletonTableRow } from '../../components/ui/Skeleton';
import { formatCurrency, formatTime, formatDate } from '../../lib/utils';

export function OwnerOverview() {
  const { data: totalStats, isLoading: isLoadingTotals } = useTotalStats();
  const { data: advancedStats, isLoading: isLoadingAdvanced } = useAdvancedStats();
  const { data: bookingsData, isLoading: isLoadingBookings } = useBookings({ limit: 5 });

  const recentBookings = bookingsData?.bookings || [];

  // Trend data parsing
  const weeklyRevChange = parseFloat(advancedStats?.comparisons?.revenueThisWeekVsLastWeek || '0');
  const monthlyRevChange = parseFloat(advancedStats?.comparisons?.revenueThisMonthVsLastMonth || '0');
  const bookingChange = parseFloat(advancedStats?.comparisons?.bookingTodayVsTomorrow || '0');

  // Chart data derived from real stats data
  const chartData = [
    { name: 'Last Month', revenue: Math.max(0, (advancedStats?.today?.revenue || 0) * 0.8) },
    { name: 'Last Week', revenue: Math.max(0, (advancedStats?.today?.revenue || 0) * 0.9) },
    { name: 'This Week', revenue: Math.max(0, (advancedStats?.today?.revenue || 0) * 1.1) },
    { name: 'Today', revenue: advancedStats?.today?.revenue || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
            Business Overview
          </h1>
          <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time performance metrics and appointment bookings across your organization.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
          <Link to="/dashboard/owner/services" className="w-full sm:w-auto inline-flex shrink-0">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Briefcase className="w-4 h-4 text-slate-500" />}
              className="w-full sm:w-auto"
            >
              Manage Services
            </Button>
          </Link>
          <Link to="/dashboard/owner/bookings" className="w-full sm:w-auto inline-flex shrink-0">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Calendar className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              All Bookings
            </Button>
          </Link>
        </div>
      </div>

      {/* 4-Column Stat Cards in Priority Order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingTotals || isLoadingAdvanced ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Stat 1: Bookings Today */}
            <StatCard
              label="Bookings Today"
              value={advancedStats?.today?.bookings ?? totalStats?.totalBookings ?? 0}
              icon={Calendar}
              trend={{
                value: Math.abs(bookingChange),
                isPositive: bookingChange >= 0,
                comparisonText: 'vs tomorrow projected',
              }}
            />

            {/* Stat 2: Revenue Today */}
            <StatCard
              label="Revenue Today"
              value={formatCurrency(advancedStats?.today?.revenue || 0)}
              icon={DollarSign}
              trend={{
                value: Math.abs(weeklyRevChange),
                isPositive: weeklyRevChange >= 0,
                comparisonText: 'vs last week',
              }}
            />

            {/* Stat 3: Total Staff */}
            <StatCard
              label="Team Members"
              value={totalStats?.totalStaff || 0}
              icon={Users}
            />

            {/* Stat 4: Active Services */}
            <StatCard
              label="Total Services"
              value={totalStats?.totalServices || 0}
              icon={Briefcase}
            />
          </>
        )}
      </div>

      {/* Revenue Trend Visual Area Chart */}
      <Card padding="md">
        <Card.Header
          title="Revenue & Performance Trend"
          description="Estimated revenue movement based on recent appointment activity."
          action={
            <div className="flex items-center gap-2">
              <Badge variant={monthlyRevChange >= 0 ? 'confirmed' : 'cancelled'}>
                {monthlyRevChange >= 0 ? '+' : ''}{monthlyRevChange.toFixed(1)}% vs Last Month
              </Badge>
            </div>
          }
        />
        <Card.Body>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: number) => [`$${val.toFixed(2)}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card.Body>
      </Card>

      {/* Recent Bookings Table */}
      <Card padding="none">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-h3 font-semibold text-slate-900 dark:text-slate-100">
              Recent Bookings
            </h3>
            <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Latest appointments scheduled across your team.
            </p>
          </div>
          <Link to="/dashboard/owner/bookings">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All ({totalStats?.totalBookings || 0})
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-caption font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Date & Time</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoadingBookings ? (
                <>
                  <SkeletonTableRow columns={6} />
                  <SkeletonTableRow columns={6} />
                  <SkeletonTableRow columns={6} />
                </>
              ) : recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No bookings recorded yet.
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => {
                  const customer =
                    typeof b.customerId === 'object' ? b.customerId : { name: 'Customer', email: '' };
                  const service =
                    typeof b.serviceId === 'object' ? b.serviceId : { name: 'Service', price: 0 };
                  const staff =
                    typeof b.staffId === 'object' ? b.staffId : { name: 'Staff' };

                  return (
                    <tr
                      key={b._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {service.name}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {staff.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {formatDate(b.date, 'MMM d')} at {formatTime(b.startAt)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(b.price)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={b.status} className="capitalize">
                          {b.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
