import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerOrg, register, registerCustomer, Login } from '../src/controllers/auth.controller.js';
import { User } from '../src/models/user.model.js';
import { Org } from '../src/models/org.model.js';
import jwt from 'jsonwebtoken';

vi.mock('../src/routes/auth.Routes.js', () => {
  return { default: {} }
})

vi.mock('../src/queues/emailQueue.js', () => {
  return { emailJob: vi.fn() }
})

vi.mock('../src/config/redis.js', () => {
  return { 
    default: {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      keys: vi.fn()
    }
  }
})

vi.mock('../src/utils/catchAsync.js', () => {
  return {
    default: (fn) => async (req, res, next) => {
      try { await fn(req, res, next); } catch(e) { next(e); }
    }
  };
});

vi.mock('../src/models/user.model.js', () => {
  const User = function(data) { Object.assign(this, data); };
  User.prototype.save = vi.fn();
  User.find = vi.fn();
  User.findOne = vi.fn();
  User.hashPassword = vi.fn();
  return { User };
});

vi.mock('../src/models/org.model.js', () => {
  const Org = function(data) { Object.assign(this, data); };
  Org.prototype.save = vi.fn();
  Org.find = vi.fn();
  Org.findOne = vi.fn();
  return { Org };
});

vi.mock('jsonwebtoken', () => {
  return { default: { sign: vi.fn() } };
});

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      orgId: 'org123'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      cookie: vi.fn()
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('registerOrg', () => {
    it('should return error if body is missing', async () => {
      req.body = undefined;
      await registerOrg(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should create an organization', async () => {
      req.body = { name: 'Test Org' };
      
      await registerOrg(req, res, next);
      
      expect(Org.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('register', () => {
    it('should return error if body is missing', async () => {
      req.body = undefined;
      await register(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return error if org not found', async () => {
      req.body = { passwordHash: 'pwd' };
      Org.findOne.mockResolvedValueOnce(null);
      await register(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should register a user successfully', async () => {
      req.body = { passwordHash: 'pwd' };
      Org.find.mockResolvedValueOnce({});
      User.hashPassword.mockResolvedValue('hashedPwd');

      await register(req, res, next);

      expect(User.hashPassword).toHaveBeenCalledWith('pwd');
      expect(User.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('registerCustomer', () => {
    it('should return error if org not found', async () => {
      req.body = { passwordHash: 'pwd' };
      req.params.orgId = 'org123';
      Org.findOne.mockResolvedValueOnce(null);
      await registerCustomer(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should register a customer successfully', async () => {
      req.body = { passwordHash: 'pwd', orgName: 'Test Org' };
      Org.findOne.mockResolvedValueOnce({ _id: 'org123' });
      User.hashPassword.mockResolvedValue('hashedPwd');

      await registerCustomer(req, res, next);

      expect(User.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Login', () => {
    it('should return error if user not found', async () => {
      req.body = { email: 'test@test.com', passwordHash: 'pwd' };
      User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
      
      await Login(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return error if password invalid', async () => {
      req.body = { email: 'test@test.com', passwordHash: 'pwd' };
      const compareMock = vi.fn().mockResolvedValue(false);
      User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue({ comparePassword: compareMock }) });
      
      await Login(req, res, next);
      expect(compareMock).toHaveBeenCalledWith('pwd');
      expect(next).toHaveBeenCalled();
    });

    it('should login successfully', async () => {
      req.body = { email: 'test@test.com', passwordHash: 'pwd' };
      const mockUser = {
        _id: '123',
        orgId: 'org123',
        name: 'John',
        email: 'test@test.com',
        role: 'user',
        comparePassword: vi.fn().mockResolvedValue(true)
      };
      User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(mockUser) });
      jwt.sign.mockReturnValue('mockToken');
      
      await Login(req, res, next);
      
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalledWith('token', 'mockToken', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
