import { describe, it, expect, vi, beforeEach } from 'vitest';

const capturedWorkers = {};
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
      capturedWorkers[name] = processor;
    }),
  };
});

vi.mock('../src/config/redis.js', () => ({
  default: {
    del: vi.fn().mockResolvedValue(1),
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
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

describe('Staff Stats Queues & Workers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize queues and register worker processors', async () => {
    const { staffStatsReset, weeklyStatsReset, monthlyStatsReset } = await import('../src/queues/staffStatsQueue.js');
    expect(staffStatsReset).toBeDefined();
    expect(weeklyStatsReset).toBeDefined();
    expect(monthlyStatsReset).toBeDefined();
    expect(capturedWorkers['staff-stats']).toBeTypeOf('function');
    expect(capturedWorkers['weekly-stats']).toBeTypeOf('function');
    expect(capturedWorkers['monthly-stats']).toBeTypeOf('function');
  });

  it('should schedule repeat cron jobs in reset functions', async () => {
    const { staffStatsReset, weeklyStatsReset, monthlyStatsReset } = await import('../src/queues/staffStatsQueue.js');
    await staffStatsReset();
    await weeklyStatsReset();
    await monthlyStatsReset();

    expect(mockQueueAdd).toHaveBeenCalledWith('staff-stats', {}, { repeat: { cron: '0 0 * * *' } });
    expect(mockQueueAdd).toHaveBeenCalledWith('weekly-stats', {}, { repeat: { cron: '0 11 * * 0' } });
    expect(mockQueueAdd).toHaveBeenCalledWith('monthly-stats', {}, { repeat: { cron: '30 23 * * *' } });
  });

  it('should calculate and cache today stats for staff members in staffStatsWorker', async () => {
    const { User } = await import('../src/models/user.model.js');
    const { Booking } = await import('../src/models/booking.model.js');
    const redis = (await import('../src/config/redis.js')).default;

    User.find.mockResolvedValueOnce([{ _id: 'staff_1' }]);

    // Booking counts
    Booking.countDocuments
      .mockResolvedValueOnce(5) // today total
      .mockResolvedValueOnce(1) // today cancelled
      .mockResolvedValueOnce(2) // today completed
      .mockResolvedValueOnce(10) // week total
      .mockResolvedValueOnce(2) // week cancelled
      .mockResolvedValueOnce(4) // week completed
      .mockResolvedValueOnce(15) // month total
      .mockResolvedValueOnce(3) // month cancelled
      .mockResolvedValueOnce(6); // month completed

    await capturedWorkers['staff-stats']({});

    expect(User.find).toHaveBeenCalledWith({ role: 'staff' });
    expect(redis.set).toHaveBeenCalledWith(
      'staff-stats:staff_1',
      JSON.stringify({
        totalBookings: 5,
        cancelledBookings: 1,
        completedBookings: 2,
        pendingBookings: 2,
      })
    );
  });

  it('should reset weekly stats for all staff members in weeklyWorker', async () => {
    const { User } = await import('../src/models/user.model.js');
    const redis = (await import('../src/config/redis.js')).default;

    User.find.mockResolvedValueOnce([{ _id: 'staff_1' }, { _id: 'staff_2' }]);
    redis.get.mockResolvedValue('{"totalBookings": 10}');

    await capturedWorkers['weekly-stats']({});

    expect(User.find).toHaveBeenCalledWith({ role: 'staff' });
    expect(redis.del).toHaveBeenCalledWith('weekly-stats:staff_1');
    expect(redis.del).toHaveBeenCalledWith('weekly-stats:staff_2');
  });

  it('should exit cleanly if no staff members exist', async () => {
    const { User } = await import('../src/models/user.model.js');
    const redis = (await import('../src/config/redis.js')).default;

    User.find.mockResolvedValueOnce([]);

    await capturedWorkers['staff-stats']({});

    expect(User.find).toHaveBeenCalledWith({ role: 'staff' });
    expect(redis.set).not.toHaveBeenCalled();
  });
});
