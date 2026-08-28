import { User } from '../models/user.model.js';
import { Org } from '../models/org.model.js';
import { Service } from '../models/service.model.js';
import Availability from '../models/availability.model.js';
import { Slots } from '../models/slots.model.js';
import { Booking } from '../models/booking.model.js';
import redis from '../config/redis.js';

export const resolvers = {
  Query: {
    health: () => 'AppointFlow GraphQL API Online 🚀',

    me: async (_, __, { user }) => {
      return user;
    },

    org: async (_, { id, slug }) => {
      if (id) return Org.findById(id);
      if (slug) return Org.findOne({ slug });
      return null;
    },

    services: async (_, { orgId }) => {
      return Service.find({ orgId, active: true });
    },

    service: async (_, { id }) => {
      return Service.findById(id);
    },

    staff: async (_, { orgId }) => {
      return User.find({
        orgId,
        role: { $in: ['staff', 'owner'] },
      }).select('-passwordHash');
    },

    slots: async (_, { staffId, date }) => {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const slotDoc = await Slots.findOne({
        staffId,
        date: {
          $gte: startOfDay,
          $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      if (!slotDoc) {
        // Try exact string match or Date object
        const altDoc = await Slots.findOne({ staffId, date });
        return altDoc?.slots || [];
      }

      return slotDoc.slots || [];
    },

    availability: async (_, { staffId, orgId }) => {
      const query = { staffId };
      if (orgId) query.orgId = orgId;
      return Availability.find(query);
    },

    bookings: async (_, { orgId, date, status }, { user }) => {
      const filter = {};

      if (orgId) {
        filter.orgId = orgId;
      } else if (user) {
        if (user.role === 'customer') {
          filter.customerId = user._id;
        } else if (user.role === 'staff') {
          filter.staffId = user._id;
        } else if (user.role === 'owner') {
          filter.orgId = user.orgId;
        }
      }

      if (date) filter.date = date;
      if (status) filter.status = status;

      return Booking.find(filter).sort({ createdAt: -1 });
    },

    todayStats: async (_, { staffId }, { user }) => {
      const targetStaffId = staffId || user?._id;
      if (!targetStaffId) return null;

      try {
        const cached = await redis.hgetall(`staff-stats:${targetStaffId}`);
        if (cached && Object.keys(cached).length > 0) {
          return {
            totalBookings: parseInt(cached.totalBookings || '0', 10),
            completed: parseInt(cached.completed || '0', 10),
            pending: parseInt(cached.pending || '0', 10),
            cancelled: parseInt(cached.cancelled || '0', 10),
          };
        }
      } catch (err) {
        // Fallback to mongo below
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const bookings = await Booking.find({ staffId: targetStaffId, date: todayStr });

      return {
        totalBookings: bookings.length,
        completed: bookings.filter((b) => b.status === 'completed').length,
        pending: bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length,
        cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      };
    },

    weeklyStats: async (_, { staffId }, { user }) => {
      const targetStaffId = staffId || user?._id;
      if (!targetStaffId) return null;

      try {
        const cached = await redis.hgetall(`weekly-stats:${targetStaffId}`);
        if (cached && Object.keys(cached).length > 0) {
          return {
            totalBookings: parseInt(cached.totalBookings || '0', 10),
            completed: parseInt(cached.completed || '0', 10),
            pending: parseInt(cached.pending || '0', 10),
            cancelled: parseInt(cached.cancelled || '0', 10),
          };
        }
      } catch (err) {
        // Fallback
      }

      return { totalBookings: 0, completed: 0, pending: 0, cancelled: 0 };
    },

    monthlyStats: async (_, { staffId }, { user }) => {
      const targetStaffId = staffId || user?._id;
      if (!targetStaffId) return null;

      try {
        const cached = await redis.hgetall(`monthly-stats:${targetStaffId}`);
        if (cached && Object.keys(cached).length > 0) {
          return {
            totalBookings: parseInt(cached.totalBookings || '0', 10),
            completed: parseInt(cached.completed || '0', 10),
            pending: parseInt(cached.pending || '0', 10),
            cancelled: parseInt(cached.cancelled || '0', 10),
          };
        }
      } catch (err) {
        // Fallback
      }

      return { totalBookings: 0, completed: 0, pending: 0, cancelled: 0 };
    },
  },

  Booking: {
    customer: async (parent) => {
      if (parent.customerId) {
        return User.findById(parent.customerId).select('-passwordHash');
      }
      return null;
    },
    staff: async (parent) => {
      if (parent.staffId) {
        return User.findById(parent.staffId).select('-passwordHash');
      }
      return null;
    },
    service: async (parent) => {
      if (parent.serviceId) {
        return Service.findById(parent.serviceId);
      }
      return null;
    },
  },
};
