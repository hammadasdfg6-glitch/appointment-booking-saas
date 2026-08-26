import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createBooking, 
  getBookings, 
  searchBookingsById, 
  searchBookingsByStaffId, 
  searchByDate, 
  searchByCustomerId, 
  searchByStatus, 
  deleteBooking, 
  setStatus 
} from '../src/controllers/bookings.controller.js';
import { Booking } from '../src/models/booking.model.js';
import { Service } from '../src/models/service.model.js';
import { User } from '../src/models/user.model.js';
import { Slots } from '../src/models/slots.model.js';

vi.mock('../src/routes/booking.Routes.js', () => {
  return { default: {} }
})

vi.mock('../src/queues/emailQueue.js', () => {
  return {
    emailJob: vi.fn()
  }
})

vi.mock('../src/utils/catchAsync.js', () => {
  return {
    default: (fn) => async (req, res, next) => {
      try { await fn(req, res, next); } catch(e) { next(e); }
    }
  };
});

vi.mock('../src/models/booking.model.js', () => {
  const Booking = function(data) { Object.assign(this, data); };
  Booking.prototype.save = vi.fn()
  Booking.find = vi.fn()
  Booking.findOne = vi.fn()
  Booking.countDocuments = vi.fn()
  return { Booking }
})

vi.mock('../src/models/service.model.js', () => {
  const Service = function(data) { Object.assign(this, data); };
  Service.findOne = vi.fn();
  return { Service };
});

vi.mock('../src/models/user.model.js', () => {
  const User = function(data) { Object.assign(this, data); };
  User.findOne = vi.fn();
  return { User };
});

vi.mock('../src/models/slots.model.js', () => {
  const Slots = function(data) { Object.assign(this, data); };
  Slots.findOne = vi.fn();
  return { Slots };
});

vi.mock('../src/config/redis.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn().mockResolvedValue([]),
    on: vi.fn()
  }
}));

vi.mock('ioredis', () => {
  const MockRedis = function() {
    this.get = vi.fn();
    this.set = vi.fn();
    this.del = vi.fn();
    this.on = vi.fn();
    this.keys = vi.fn().mockResolvedValue([]);
  };
  return { default: MockRedis };
});

describe('Bookings Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      orgId: 'org123',
      user: { _id: 'cust123', role: 'customer' }
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should return error if body missing', async () => {
      req.body = undefined;
      await createBooking(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should create booking successfully', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      req.body = {
        orgId: 'org123',
        customerId: 'cust123',
        serviceId: 'serv123',
        staffId: 'staff123',
        startAt: '10:00',
        date: futureDate.getTime()
      };

      Service.findOne.mockResolvedValue({ price: 100, durationMinutes: 60 });
      User.findOne.mockResolvedValue({ role: 'staff' });
      
      const saveSlotMock = vi.fn();
      Slots.findOne.mockResolvedValue({
        slots: [{ _id: 'slot1', startTime: '10:00', endTime: '11:00', status: 'available' }],
        save: saveSlotMock,
      });

      await createBooking(req, res, next);
      if (next.mock.calls.length > 0) {
        console.log('Test Failed. next called with:', next.mock.calls[0][0]);
      }

      expect(Booking.prototype.save).toHaveBeenCalled();
      expect(saveSlotMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getBookings', () => {
    it('should get bookings', async () => {
      Booking.find.mockReturnValue({
          populate: vi.fn().mockReturnThis(),
          sort: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: 1 }])
      })
      Booking.countDocuments.mockResolvedValue(1)

      await getBookings(req, res, next)
      
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
          success: true, 
          total: 1, 
          totalPages: 1 
      }))
    })
  })

  describe('deleteBooking', () => {
    it('should return error if params id missing', async () => {
      req.params.id = undefined;
      await deleteBooking(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should cancel a booking', async () => {
      req.params.id = 'book123';
      const saveBookingMock = vi.fn();
      Booking.findOne.mockResolvedValue({ 
        staffId: 'staff123', 
        slotId: 'slot123',
        customerId: 'cust123',
        date: '2026-10-15',
        startAt: '10:00',
        endAt: '11:00',
        save: saveBookingMock 
      });
      
      const saveSlotMock = vi.fn();
      Slots.findOne.mockResolvedValue({
        slots: [{ startTime: '10:00', endTime: '11:00', status: 'locked', _id: { equals: () => true } }],
        save: saveSlotMock
      });

      await deleteBooking(req, res, next);

      expect(saveBookingMock).toHaveBeenCalled();
      expect(saveSlotMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('setStatus', () => {
    it('should return error if params id missing', async () => {
      req.params.id = undefined;
      await setStatus(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should update booking status', async () => {
      req.params.id = 'book123';
      req.body = { status: 'completed' };
      const saveBookingMock = vi.fn();
      Booking.findOne.mockResolvedValue({ staffId: 'staff123', date: '2026-10-15', save: saveBookingMock });
      
      await setStatus(req, res, next);
      
      expect(saveBookingMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should update staff stats in Redis when booking status is updated for today', async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      req.params.id = 'book123';
      req.body = { status: 'completed' };

      const saveBookingMock = vi.fn();
      Booking.findOne.mockResolvedValue({
        staffId: 'staff123',
        date: todayStr,
        customerId: 'cust123',
        save: saveBookingMock
      });

      const redis = (await import('../src/config/redis.js')).default;
      redis.get.mockResolvedValueOnce(JSON.stringify({
        totalBookings: 2,
        completedBookings: 0,
        cancelledBookings: 0,
        pendingBookings: 2
      }));

      Booking.countDocuments
        .mockResolvedValueOnce(0) // cancelled
        .mockResolvedValueOnce(1) // completed
        .mockResolvedValueOnce(2); // total

      await setStatus(req, res, next);

      expect(redis.set).toHaveBeenCalledWith(
        'staff-stats:staff123',
        JSON.stringify({
          totalBookings: 2,
          completedBookings: 1,
          cancelledBookings: 0,
          pendingBookings: 1
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});

