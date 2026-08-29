import { describe, it, expect, vi, beforeEach } from 'vitest'
process.env.STRIPE_SECRET_KEY = 'test_key'
import { confirmCheckout, createCheckoutSession } from '../src/controllers/checkout.controller.js'
import { Booking } from '../src/models/booking.model.js'
import { Service } from '../src/models/service.model.js'
import { Slots } from '../src/models/slots.model.js'
import { Stats } from '../src/models/stats.model.js'
import Stripe from 'stripe'

vi.mock('../src/utils/catchAsync.js', () => {
  return {
    default: (fn) => async (req, res, next) => {
      try { await fn(req, res, next) } catch(e) { next(e) }
    }
  }
})

vi.mock('../src/models/revenue.model.js', () => {
  const Revenue = function(data) { Object.assign(this, data); };
  Revenue.prototype.save = vi.fn();
  Revenue.aggregate = vi.fn();
  return { Revenue };
})

vi.mock('../src/controllers/bookings.controller.js', () => ({
  createBooking: vi.fn((req, res) => res.json({ booking: { _id: 'b1' } }))
}))

vi.mock('../src/models/booking.model.js', () => ({
  Booking: { 
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    prototype: {
      save: vi.fn()
    }
  }
}))

vi.mock('../src/models/service.model.js', () => ({
  Service: { 
    findById: vi.fn()
  }
}))

vi.mock('../src/models/slots.model.js', () => ({
  Slots: { 
    findOneAndUpdate: vi.fn()
  }
}))

vi.mock('../src/models/stats.model.js', () => ({
  Stats: { 
    findOneAndUpdate: vi.fn()
  }
}))

const { mockRetrieve, mockCreate } = vi.hoisted(() => ({
  mockRetrieve: vi.fn(),
  mockCreate: vi.fn()
}))

vi.mock('stripe', () => {
  return {
    default: class Stripe {
      constructor() {
        this.checkout = {
          sessions: {
            retrieve: mockRetrieve,
            create: mockCreate
          }
        }
      }
    }
  }
})

describe('Checkout Controller', () => {
  let req, res, next

  beforeEach(() => {
    req = { orgId: 'org123', query: {}, body: {} }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      redirect: vi.fn()
    }
    next = vi.fn()
    vi.clearAllMocks()
  })

  describe('confirmCheckout', () => {
    it('should return error if session_id is missing', async () => {
      req.query = {}
      await confirmCheckout(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('should handle paid session confirmation', async () => {
      req.query = { session_id: 'cs_test_123' }
      mockRetrieve.mockResolvedValue({ payment_status: 'paid', status: 'complete', amount_total: 5000, id: 'cs_test_123', metadata: { orgId: 'org123', customerId: 'cust123', serviceId: 'serv123', staffId: 'staff123', slotId: 'slot123', date: '2026-10-15' } })
      Booking.findOne.mockResolvedValue(null)
      Booking.findByIdAndUpdate.mockResolvedValue({})

      await confirmCheckout(req, res, next)

      expect(mockRetrieve).toHaveBeenCalledWith('cs_test_123')
      expect(Booking.findOne).toHaveBeenCalledWith({ stripeSessionId: 'cs_test_123' })
      expect(Stats.findOneAndUpdate).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    }, 10000)
  })
})
