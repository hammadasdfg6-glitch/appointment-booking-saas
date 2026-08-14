import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  addAvailability, 
  getAvailability, 
  updAvailability, 
  delAvailability, 
  slotsGeneration, 
  getSlots 
} from '../src/controllers/avail.controller.js';
import Availability from '../src/models/availability.model.js';
import { User } from '../src/models/user.model.js';
import { Slots } from '../src/models/slots.model.js';

vi.mock('../src/utils/catchAsync.js', () => {
  return {
    default: (fn) => async (req, res, next) => {
      try { await fn(req, res, next); } catch(e) { next(e); }
    }
  };
});

vi.mock('../src/models/availability.model.js', () => {
  const Availability = function(data) { Object.assign(this, data); };
  Availability.prototype.save = vi.fn();
  Availability.findOne = vi.fn();
  Availability.findOneAndUpdate = vi.fn();
  Availability.findOneAndDelete = vi.fn();
  return { default: Availability };
});

vi.mock('../src/models/user.model.js', () => {
  const User = function(data) { Object.assign(this, data); };
  User.prototype.save = vi.fn();
  User.findOne = vi.fn();
  return { User };
});

vi.mock('../src/models/slots.model.js', () => {
  const Slots = function(data) { Object.assign(this, data); };
  Slots.prototype.save = vi.fn();
  Slots.findOne = vi.fn();
  Slots.findOneAndUpdate = vi.fn();
  return { Slots };
});


describe('Availability Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        orgId: 'org123',
        _id: 'staff123'
      }
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('addAvailability', () => {
    it('should add availability successfully', async () => {
      req.body = { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' };
      Availability.prototype.save.mockResolvedValue(req.body);
      
      await addAvailability(req, res, next);
      
      expect(Availability.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should handle duplicate entry error', async () => {
      const error = new Error('Duplicate');
      error.code = 11000;
      error.keyPattern = { staffId: 1 };
      
      Availability.prototype.save.mockRejectedValue(error);
      
      await addAvailability(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('getAvailability', () => {
    it('should return error if staffId missing', async () => {
      await getAvailability(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return availability', async () => {
      req.params.staffId = 'staff123';
      User.findOne.mockResolvedValue({ role: 'staff' });
      Availability.findOne.mockResolvedValue({ startTime: '09:00' });
      
      await getAvailability(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('updAvailability', () => {
    it('should return error if staffId missing', async () => {
      await updAvailability(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should update availability', async () => {
      req.params.staffId = 'staff123';
      Availability.findOne.mockResolvedValue({});
      Availability.findOneAndUpdate.mockResolvedValue({});
      
      await updAvailability(req, res, next);
      expect(Availability.findOneAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delAvailability', () => {
    it('should return error if staffId missing in params', async () => {
      await delAvailability(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should delete availability', async () => {
      req.params.staffId = 'staff123';
      Availability.findOne.mockResolvedValue({});
      Availability.findOneAndDelete.mockResolvedValue({});
      
      await delAvailability(req, res, next);
      expect(Availability.findOneAndDelete).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('slotsGeneration', () => {
    it('should return error if body missing', async () => {
      req.body = undefined;
      await slotsGeneration(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should generate slots', async () => {
      req.body = { staffId: 'staff123', date: '2026-08-05', duration: 30 };
      Availability.findOne.mockResolvedValue({ startTime: '09:00', endTime: '10:00' });
      Slots.findOneAndUpdate.mockResolvedValue({ slots: [] });
      
      await slotsGeneration(req, res, next);
      
      expect(Slots.findOneAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getSlots', () => {
    it('should return error if query params missing', async () => {
      req.query = {};
      await getSlots(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should get available slots', async () => {
      req.query = { staffId: 'staff123', date: '2026-08-05' };
      Slots.findOne.mockResolvedValue({ 
        slots: {
          filter: vi.fn().mockReturnValue([{ status: 'available' }])
        } 
      });
      
      await getSlots(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, total: 1 }));
    });
  });
});
