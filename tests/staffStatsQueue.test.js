import { describe, it, expect, vi, beforeEach } from 'vitest';

let capturedWorkerProcessor = null;
const mockQueueAdd = vi.fn();

vi.mock('bullmq', () => {
  return {
    Queue: vi.fn().mockImplementation(function (name, opts) {
      this.name = name;
      this.opts = opts;
      this.add = mockQueueAdd;
    }),
    Worker: vi.fn().mockImplementation(function (name, processor, opts) {
      this.name = name;
      this.processor = processor;
      this.opts = opts;
      capturedWorkerProcessor = processor;
    }),
  };
});

vi.mock('../src/config/redis.js', () => ({
  default: {
    del: vi.fn().mockResolvedValue(1),
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn(),
  },
}));

vi.mock('../src/models/user.model.js', () => ({
  User: {
    find: vi.fn(),
  },
}));

vi.mock('../src/models/booking.model.js', () => ({
  Booking: {
    countDocuments: vi.fn(),
  },
}));

describe('Staff Stats Queue & Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize queue and register worker processor', async () => {
    const { staffStatsReset } = await import('../src/queues/staffStatsQueue.js');
    expect(staffStatsReset).toBeDefined();
    expect(capturedWorkerProcessor).toBeTypeOf('function');
  });

  it('should schedule daily midnight repeat cron job in staffStatsReset', async () => {
    const { staffStatsReset } = await import('../src/queues/staffStatsQueue.js');
    await staffStatsReset();

    expect(mockQueueAdd).toHaveBeenCalledWith(
      'staff-stats',
      {},
      {
        repeat: {
          cron: '0 0 * * *',
        },
      }
    );
  });

  it('should calculate and cache today stats for all staff members when worker runs', async () => {
    const { User } = await import('../src/models/user.model.js');
    const { Booking } = await import('../src/models/booking.model.js');
    const redis = (await import('../src/config/redis.js')).default;

    User.find.mockResolvedValueOnce([
      { _id: 'staff_1' },
      { _id: 'staff_2' },
    ]);

    // staff_1 counts
    Booking.countDocuments
      .mockResolvedValueOnce(5) // total
      .mockResolvedValueOnce(1) // cancelled
      // staff_2 counts
      .mockResolvedValueOnce(3) // total
      .mockResolvedValueOnce(0); // cancelled

    await capturedWorkerProcessor({});

    expect(User.find).toHaveBeenCalledWith({ role: 'staff' });
    expect(redis.del).toHaveBeenCalledWith('staff-stats:staff_1');
    expect(redis.del).toHaveBeenCalledWith('staff-stats:staff_2');

    expect(redis.set).toHaveBeenCalledWith(
      'staff-stats:staff_1',
      JSON.stringify({
        totalBookings: 5,
        pendingBookings: 5,
        completedBookings: 0,
        cancelledBookings: 1,
      })
    );

    expect(redis.set).toHaveBeenCalledWith(
      'staff-stats:staff_2',
      JSON.stringify({
        totalBookings: 3,
        pendingBookings: 3,
        completedBookings: 0,
        cancelledBookings: 0,
      })
    );
  });

  it('should exit cleanly if no staff members exist', async () => {
    const { User } = await import('../src/models/user.model.js');
    const redis = (await import('../src/config/redis.js')).default;

    User.find.mockResolvedValueOnce([]);

    await capturedWorkerProcessor({});

    expect(User.find).toHaveBeenCalledWith({ role: 'staff' });
    expect(redis.set).not.toHaveBeenCalled();
  });
});
