import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerOrg, register, registerCustomer, Login, getProfile, updateProfile } from '../src/controllers/auth.controller.js';
import { User } from '../src/models/user.model.js';
import { Org } from '../src/models/org.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

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
  User.findById = vi.fn();
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

  describe('getProfile', () => {
    it('should return 404 if user not found', async () => {
      req.user = { _id: 'u1' };
      User.findById.mockResolvedValue(null);

      await getProfile(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return user profile', async () => {
      req.user = { _id: 'u1' };
      User.findById.mockResolvedValue({
        _id: 'u1',
        name: 'Jane',
        email: 'jane@test.com',
        role: 'customer',
        orgId: 'org123',
      });

      await getProfile(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({ name: 'Jane', email: 'jane@test.com' }),
        })
      );
    });
  });

  describe('updateProfile', () => {
    it('should update name and email successfully', async () => {
      req.user = { _id: 'u1' };
      req.body = { name: 'Jane Doe', email: 'janedoe@test.com' };
      const mockUser = {
        _id: 'u1',
        name: 'Jane',
        email: 'old@test.com',
        role: 'customer',
        orgId: 'org123',
        save: vi.fn().mockResolvedValue(true),
      };
      User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });
      User.findOne.mockResolvedValue(null);

      await updateProfile(req, res, next);

      expect(mockUser.name).toBe('Jane Doe');
      expect(mockUser.email).toBe('janedoe@test.com');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Profile updated successfully!',
        })
      );
    });

    it('should change password successfully when old password matches', async () => {
      req.user = { _id: 'u1' };
      req.body = { oldPassword: 'oldPass123', newPassword: 'newPass123' };
      const mockUser = {
        _id: 'u1',
        name: 'Jane',
        email: 'jane@test.com',
        role: 'customer',
        passwordHash: 'hashedOldPass',
        save: vi.fn().mockResolvedValue(true),
      };
      User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('hashedNewPass');

      await updateProfile(req, res, next);

      expect(bcrypt.compare).toHaveBeenCalledWith('oldPass123', 'hashedOldPass');
      expect(mockUser.passwordHash).toBe('hashedNewPass');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if old password does not match', async () => {
      req.user = { _id: 'u1' };
      req.body = { oldPassword: 'wrongPass', newPassword: 'newPass123' };
      const mockUser = {
        _id: 'u1',
        passwordHash: 'hashedOldPass',
        save: vi.fn(),
      };
      User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });
      bcrypt.compare.mockResolvedValue(false);

      await updateProfile(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    it('should return 409 if new email is already in use by another user', async () => {
      req.user = { _id: 'u1' };
      req.body = { email: 'alreadytaken@test.com' };
      const mockUser = {
        _id: 'u1',
        name: 'Jane',
        email: 'old@test.com',
        role: 'customer',
        save: vi.fn(),
      };
      User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });
      User.findOne.mockResolvedValue({ _id: 'other_user' });

      await updateProfile(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(mockUser.save).not.toHaveBeenCalled();
    });
  });
});
