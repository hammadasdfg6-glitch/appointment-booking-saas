import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  addService, 
  dispServices, 
  updServices, 
  delServices 
} from '../src/controllers/service.controller.js';
import { Service } from '../src/models/service.model.js';

vi.mock('../src/utils/catchAsync.js', () => {
  return {
    default: (fn) => async (req, res, next) => {
      try { await fn(req, res, next); } catch(e) { next(e); }
    }
  };
});

vi.mock('../src/models/service.model.js', () => {
  const Service = function(data) { Object.assign(this, data); };
  Service.prototype.save = vi.fn()
  Service.find = vi.fn()
  Service.findOne = vi.fn()
  Service.findByIdAndUpdate = vi.fn()
  Service.countDocuments = vi.fn()
  return { Service }
})

describe('Service Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      orgId: 'org123'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('addService', () => {
    it('should return error if body is missing', async () => {
      req.body = undefined;
      await addService(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should create a service', async () => {
      req.body = { name: 'Haircut' };
      
      await addService(req, res, next);
      
      expect(Service.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('dispServices', () => {
    it('should return error if no services found', async () => {
      Service.find.mockReturnValue({
          sort: vi.fn().mockReturnValue({
              skip: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([])
              })
          })
      })
      Service.countDocuments.mockResolvedValue(0)
      req.query = { page: 1, limit: 10 }
      
      await dispServices(req, res, next)
      
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false })) 
    })

    it('should display services', async () => {
      Service.find.mockReturnValue({
          sort: vi.fn().mockReturnValue({
              skip: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{ name: 'Haircut' }])
              })
          })
      })
      Service.countDocuments.mockResolvedValue(1)
      req.query = { page: 1, limit: 10 }
      
      await dispServices(req, res, next)
      
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, total: 1, totalPages: 1 }))
    })
  })

  describe('updServices', () => {
    it('should return error if name is missing', async () => {
      req.params.name = undefined;
      await updServices(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return error if service not found', async () => {
      req.params.name = 'Haircut';
      Service.findOne.mockResolvedValue(null);
      await updServices(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should update service', async () => {
      req.params.name = 'Haircut';
      req.body = { price: 200 };
      Service.findOne.mockResolvedValue({ _id: 'serv123' });
      Service.findByIdAndUpdate.mockResolvedValue({});
      
      await updServices(req, res, next);
      
      expect(Service.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('delServices', () => {
    it('should return error if name is missing in params', async () => {
      req.params.name = undefined;
      await delServices(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return error if service not found', async () => {
      req.params.name = 'Haircut';
      Service.findOne.mockResolvedValue(null);
      await delServices(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should soft delete service', async () => {
      req.params.name = 'Haircut';
      Service.findOne.mockResolvedValue({ _id: 'serv123' });
      Service.findByIdAndUpdate.mockResolvedValue({});
      
      await delServices(req, res, next);
      
      expect(Service.findByIdAndUpdate).toHaveBeenCalledWith({ _id: 'serv123' }, { active: false });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
