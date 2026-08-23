import { Booking } from '../types/api';

/**
 * Exports an array of bookings to a CSV file and downloads it
 */
export function exportBookingsToCsv(bookings: Booking[], filename = 'appointflow-bookings.csv'): void {
  if (!bookings || bookings.length === 0) return;

  const headers = [
    'Booking ID',
    'Date',
    'Start Time',
    'End Time',
    'Service',
    'Price ($)',
    'Customer Name',
    'Customer Email',
    'Provider Name',
    'Provider Email',
    'Status',
    'Payment Type',
  ];

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = bookings.map((b) => {
    const serviceName = typeof b.serviceId === 'object' ? b.serviceId?.name : 'Service';
    const servicePrice = typeof b.serviceId === 'object' ? (b.serviceId?.price ?? 0) : 0;
    const customerName = typeof b.customerId === 'object' ? b.customerId?.name : 'Customer';
    const customerEmail = typeof b.customerId === 'object' ? b.customerId?.email : '';
    const staffName = typeof b.staffId === 'object' ? b.staffId?.name : 'Staff';
    const staffEmail = typeof b.staffId === 'object' ? (b.staffId as { email?: string })?.email || '' : '';

    return [
      escapeCsv(b._id),
      escapeCsv(b.date),
      escapeCsv(b.startAt || ''),
      escapeCsv(b.endAt || ''),
      escapeCsv(serviceName),
      escapeCsv(servicePrice),
      escapeCsv(customerName),
      escapeCsv(customerEmail),
      escapeCsv(staffName),
      escapeCsv(staffEmail),
      escapeCsv(b.status || 'pending'),
      escapeCsv(b.stripeSessionId ? 'Stripe Paid' : 'Direct Free'),
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
