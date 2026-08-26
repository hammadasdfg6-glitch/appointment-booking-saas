import { describe, it, expect, vi, beforeEach } from 'vitest'
import { totalStats } from '../src/controllers/stats.controller.js'
import { User } from '../src/models/user.model.js'
import Availability from '../src/models/availability.model.js'
import { Booking } from '../src/models/booking.model.js'
import { Service } from '../src/models/service.model.js'
import { Slots } from '../src/models/slots.model.js'
import redis from '../src/config/redis.js'

vi.mock('../src/utils/catchAsync.js', () => {
  return {
    default: (fn) => async (req, res, next) => {
      try { await fn(req, res, next) } catch(e) { next(e) }
    }
  }
})

vi.mock('../src/models/user.model.js', () => ({
  User: { 
      countDocuments: vi.fn(),
      find: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue([{ _id: 'staff1' }, { _id: 'staff2' }]) })
  }
}))

vi.mock('../src/models/availability.model.js', () => ({
  default: { countDocuments: vi.fn() }
}))

vi.mock('../src/models/booking.model.js', () => ({
  Booking: { countDocuments: vi.fn() }
}))

vi.mock('../src/models/service.model.js', () => ({
  Service: { countDocuments: vi.fn() }
}))

vi.mock('../src/models/slots.model.js', () => ({
  Slots: { countDocuments: vi.fn() }
}))

vi.mock('../src/config/redis.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn()
  }
}))

vi.mock('../src/models/stats.model.js', () => ({
  Stats: { 
    findOne: vi.fn(),
    find: vi.fn()
  }
}))

describe('Stats Controller', () => {
  let req, res, next

  beforeEach(() => {
    req = { orgId: 'org123' }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    next = vi.fn()
    vi.clearAllMocks()
  })

  describe('totalStats', () => {
    it('should return cached stats if available', async () => {
      const cachedData = {
        success: true,
        totalAvailabilities: 5,
        totalBookings: 10,
        totalCustomers: 15,
        totalServices: 2,
        totalSlots: 20,
        totalStaff: 3
      }
      redis.get.mockResolvedValueOnce(JSON.stringify(cachedData))

      await totalStats(req, res, next)

      expect(redis.get).toHaveBeenCalledWith('total:org123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(cachedData)
      expect(User.countDocuments).not.toHaveBeenCalled()
    })

    it('should query DB and cache if no cached data exists', async () => {
      redis.get.mockResolvedValueOnce(null)
      Availability.countDocuments.mockResolvedValueOnce(5)
      User.countDocuments.mockResolvedValueOnce(15) // customers
      Booking.countDocuments.mockResolvedValueOnce(10)
      Service.countDocuments.mockResolvedValueOnce(2)
      Slots.countDocuments.mockResolvedValueOnce(20)
      User.countDocuments.mockResolvedValueOnce(3) // staff

      await totalStats(req, res, next)

      expect(redis.get).toHaveBeenCalledWith('total:org123')
      expect(Availability.countDocuments).toHaveBeenCalled()
      expect(User.countDocuments).toHaveBeenCalledTimes(1)
      expect(User.find).toHaveBeenCalled()
      expect(Booking.countDocuments).toHaveBeenCalledWith({active: true, orgId: 'org123'})
      expect(Service.countDocuments).toHaveBeenCalled()
      expect(Slots.countDocuments).toHaveBeenCalled()
      
      expect(redis.set).toHaveBeenCalledWith(
        'total:org123',
        expect.any(String),
        'EX',
        expect.any(Number)
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        totalAvailabilities: 5,
        totalBookings: 10,
        totalCustomers: 15,
        totalServices: 2,
        totalSlots: 20,
        totalStaff: 2
      }))
    })
  })

  describe('getAdvancedStats', () => {
    it('should return advanced stats based on db aggregations', async () => {
      const { getAdvancedStats } = await import('../src/controllers/stats.controller.js')
      const { Stats } = await import('../src/models/stats.model.js')
      
      Stats.findOne = vi.fn().mockResolvedValue({ totalBookings: 10, totalRevenue: 100 })
      Stats.find = vi.fn().mockResolvedValue([{ totalBookings: 5, totalRevenue: 50 }])

      await getAdvancedStats(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Object)
      }))
    })
  })

  describe('todayStaffStats', () => {
    it('should return cached daily staff stats if available', async () => {
      const { todayStaffStats } = await import('../src/controllers/stats.controller.js')
      req.user = { _id: 'staff123' }

      const cachedStats = {
        totalBookings: 5,
        cancelledBookings: 1,
        completedBookings: 2,
        pendingBookings: 2
      }
      redis.get.mockResolvedValueOnce(JSON.stringify(cachedStats))

      await todayStaffStats(req, res, next)

      expect(redis.get).toHaveBeenCalledWith('staff-stats:staff123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: `Today's Booking Data`,
        success: true,
        todayBookingData: cachedStats
      })
      expect(Booking.countDocuments).not.toHaveBeenCalled()
    })

    it('should calculate stats from DB and cache in Redis on cache miss', async () => {
      const { todayStaffStats } = await import('../src/controllers/stats.controller.js')
      req.user = { _id: 'staff123' }

      redis.get.mockResolvedValueOnce(null)
      Booking.countDocuments
        .mockResolvedValueOnce(6) // total
        .mockResolvedValueOnce(1) // cancelled
        .mockResolvedValueOnce(2) // completed

      await todayStaffStats(req, res, next)

      expect(redis.get).toHaveBeenCalledWith('staff-stats:staff123')
      expect(Booking.countDocuments).toHaveBeenCalledTimes(3)
      expect(redis.set).toHaveBeenCalledWith(
        'staff-stats:staff123',
        JSON.stringify({
          totalBookings: 6,
          cancelledBookings: 1,
          completedBookings: 2,
          pendingBookings: 3
        }),
        'EX',
        86400
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: `Today's Booking Data`,
        success: true,
        todayBookingData: {
          totalBookings: 6,
          cancelledBookings: 1,
          completedBookings: 2,
          pendingBookings: 3
        }
      })
    })
  })
})

