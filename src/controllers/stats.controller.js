import { User } from "../models/user.model.js";
import Availability from "../models/availability.model.js";
import { Booking } from "../models/booking.model.js";
import { Service } from "../models/service.model.js";
import { Slots } from "../models/slots.model.js";
import { Stats } from "../models/stats.model.js";
import { formatDateString } from "../utils/timeUtilis.js"
import catchAsync from "../utils/catchAsync.js"
import AppError from "../utils/appError.js"
import redis from "../config/redis.js"
import { Revenue } from "../models/revenue.model.js";

export const totalStats = catchAsync(async (req,res,next) => {
    
    const orgId = req.orgId;
    const cacheKey = `total:${orgId}`
    const cached = await redis.get(cacheKey)
    if(cached){
        return res.status(200).json(JSON.parse(cached))
    }
    
    const staffMembers = await User.find({ orgId, role: { $in: ['staff', 'owner'] } }).select('_id');
    const staffIds = staffMembers.map(staff => staff._id);
    
    const totalAvailabilities = await Availability.countDocuments({ orgId })
    const totalCustomers = await User.countDocuments({role: 'customer', orgId})
    const totalBookings = await Booking.countDocuments({active: true, orgId})
    const totalServices = await Service.countDocuments({ orgId })
    const totalSlots = await Slots.countDocuments({ staffId: { $in: staffIds } })
    const totalStaff = staffMembers.length

    const total = {
        success: true,
        totalAvailabilities,
        totalBookings,
        totalCustomers,
        totalServices,
        totalSlots,
        totalStaff,
    }

    await redis.set(cacheKey,JSON.stringify(total),'EX',60 + (Math.floor(Math.random() * 10) + 1))
    return res.status(200).json(total)

})

export const getAdvancedStats = catchAsync(async (req, res, next) => {
    const orgId = req.orgId;
    
    const today = new Date();
    const todayStr = formatDateString(today);
    

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDateString(tomorrow);
    
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = formatDateString(lastWeek);
    
    
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    const lastMonthStr = formatDateString(lastMonth);

    const todayStats = await Stats.findOne({ orgId, date: todayStr });
    const tomorrowStats = await Stats.findOne({ orgId, date: tomorrowStr });
    
    
    const thisWeekStats = await Stats.find({ orgId, date: { $gte: lastWeekStr, $lte: todayStr } });
    const thisWeekRevenue = thisWeekStats.reduce((acc, stat) => acc + stat.totalRevenue, 0);

    
    const thisMonthStats = await Stats.find({ orgId, date: { $gte: lastMonthStr, $lte: todayStr } });
    const thisMonthRevenue = thisMonthStats.reduce((acc, stat) => acc + stat.totalRevenue, 0);

    
    const bookingsToday = todayStats ? todayStats.totalBookings : 0;
    const bookingsTomorrow = tomorrowStats ? tomorrowStats.totalBookings : 0;
    
    let bookingPercentageChange = 0;
    if (bookingsTomorrow > 0) 
        {
        bookingPercentageChange = ((bookingsToday - bookingsTomorrow) / bookingsTomorrow) * 100;
    } 
    else if (bookingsToday > 0) {
        bookingPercentageChange = 100; 
    }

    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const twoWeeksAgoStr = formatDateString(twoWeeksAgo);
    const lastWeekOnlyStats = await Stats.find({ orgId, date: { $gte: twoWeeksAgoStr, $lt: lastWeekStr } });
    const lastWeekRevenue = lastWeekOnlyStats.reduce((acc, stat) => acc + stat.totalRevenue, 0);

    const twoMonthsAgo = new Date();

    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
    const twoMonthsAgoStr = formatDateString(twoMonthsAgo);
    const lastMonthOnlyStats = await Stats.find({ orgId, date: { $gte: twoMonthsAgoStr, $lt: lastMonthStr } });
    const lastMonthRevenue = lastMonthOnlyStats.reduce((acc, stat) => acc + stat.totalRevenue, 0);

    let weeklyRevenueChange = 0;
    if(lastWeekRevenue > 0)
        {
        weeklyRevenueChange = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;
    } 
    else if(thisWeekRevenue > 0)
        {
        weeklyRevenueChange = 100;
    }

    let monthlyRevenueChange = 0;
    
    if (lastMonthRevenue > 0) 
        {
        monthlyRevenueChange = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } 
    else if (thisMonthRevenue > 0) 
        {
        monthlyRevenueChange = 100;
    }
    
    return res.status(200).json({
        success: true,
        data: {
            today: {
                bookings: bookingsToday,
                revenue: todayStats ? todayStats.totalRevenue : 0
            },
            tomorrow: {
                bookings: bookingsTomorrow
            },
            timeline: {
                lastMonthRevenue: lastMonthRevenue || 0,
                lastWeekRevenue: lastWeekRevenue || 0,
                thisWeekRevenue: thisWeekRevenue || 0,
                todayRevenue: todayStats ? (todayStats.totalRevenue || 0) : 0
            },
            comparisons: {
                bookingTodayVsTomorrow: bookingPercentageChange.toFixed(2),
                revenueThisWeekVsLastWeek: weeklyRevenueChange.toFixed(2),
                revenueThisMonthVsLastMonth: monthlyRevenueChange.toFixed(2)
            }
        }
    });
});

export const todayStaffStats = catchAsync( async (req,res) => {
    const key = `staff-stats:${req.user._id}`
    const cacheKey = await redis.get(key)
    if(cacheKey){
        const todayBookingData = JSON.parse(cacheKey)
        return res.status(200).json({
            message: `Today's Booking Data`,
            success: true,
            todayBookingData
        })
    }

    const currentDate = new Date().toISOString().split("T")[0]
    const [totalBookings, cancelledBookings, completedBookings] = await Promise.all([
        Booking.countDocuments({ staffId:req.user._id, date: currentDate }),
        Booking.countDocuments({ staffId:req.user._id, date: currentDate, status: 'cancelled' }),
        Booking.countDocuments({ staffId:req.user._id, date: currentDate, status: 'completed' }),
    ]);

    const todayBookingData = {
        totalBookings,
        cancelledBookings,
        completedBookings,
        pendingBookings: Math.max(0, totalBookings - (completedBookings + cancelledBookings))
    }

    await redis.set(key, JSON.stringify(todayBookingData), 'EX', 86400)
    return res.status(200).json({
        message: `Today's Booking Data`,
        success: true,
        todayBookingData
    })

})

export const weeklyStaffStats = catchAsync( async (req,res,next) => {
    const key = `weekly-stats:${req.user._id}`
    const cached = await redis.get(key)
    if(cached){
        const weeklyStats = JSON.parse(cached)
        return res.status(200).json({
            message: `Weekly Booking Data`,
            success: true,
            weeklyStats
        })
    }

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const todayStr = today.toISOString().split("T")[0];
    const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

    const [totalBookings, cancelledBookings, completedBookings] = await Promise.all([
        Booking.countDocuments({ staffId: req.user._id, date: { $gte: startOfWeekStr, $lte: todayStr } }),
        Booking.countDocuments({ staffId: req.user._id, date: { $gte: startOfWeekStr, $lte: todayStr }, status: 'cancelled' }),
        Booking.countDocuments({ staffId: req.user._id, date: { $gte: startOfWeekStr, $lte: todayStr }, status: 'completed' }),
    ]);
    const weeklyStats = {
        totalBookings,
        cancelledBookings,
        completedBookings,
        pendingBookings: Math.max(0, totalBookings - (completedBookings + cancelledBookings))
    };

    await redis.set(key, JSON.stringify(weeklyStats))

    return res.status(200).json({
        message: `Weekly Booking Data`,
        success: true,
        weeklyStats
    })

})

export const monthlyStaffStats = catchAsync( async (req,res,next) => {
    const key = `monthly-stats:${req.user._id}`
    const cached = await redis.get(key)
    if(cached){
        const monthlyStats = JSON.parse(cached)
        return res.status(200).json({
            message: `monthly Booking Data`,
            success: true,
            monthlyStats
        })
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const todayStr = today.toISOString().split("T")[0];
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

    const [totalBookings, cancelledBookings, completedBookings] = await Promise.all([
        Booking.countDocuments({ staffId: req.user._id, date: { $gte: startOfMonthStr, $lte: todayStr } }),
        Booking.countDocuments({ staffId: req.user._id, date: { $gte: startOfMonthStr, $lte: todayStr }, status: 'cancelled' }),
        Booking.countDocuments({ staffId: req.user._id, date: { $gte: startOfMonthStr, $lte: todayStr }, status: 'completed' }),
    ]);
    const monthlyStats = {
        totalBookings,
        cancelledBookings,
        completedBookings,
        pendingBookings: Math.max(0, totalBookings - (completedBookings + cancelledBookings))
    };

    await redis.set(key, JSON.stringify(monthlyStats))

    return res.status(200).json({
        message: `monthly Booking Data`,
        success: true,
        monthlyStats
    })

})


export const revenueStats = catchAsync( async (req,res,next) => {
    const {staffId, serviceId, date} = req.query
    const dbquery = {}
    if(serviceId) dbquery.serviceId = serviceId
    if(staffId) dbquery.staffId = staffId
    if(date) dbquery.date = date
    
    if(0 === Object.keys(dbquery).length){
        return next(new AppError('Must provide some filters','Query Parameters are missing',400))
    }

    dbquery.orgId = req.orgId
    dbquery.status = 'paid'
    
    const key = `revenue:${req.orgId}:${JSON.stringify(dbquery)}`
    const cached = await redis.get(key)
    if(cached){
        return res.status(200).json({
        message: 'Got the Revenue',
        success: true,
        totalAmmount: JSON.parse(cached)
        })
    }
    

    const revenue = await Revenue.find(dbquery).select('+amount -_id').lean()
    if(0 === revenue.length){
        return res.status(200).json({
            message: 'No Revenue Yet!',
            success: true,
            totalAmmount: 0
        })
    }
    const ammounts = revenue.map(item => Number(item.amount))

    const totalAmmount = ammounts.reduce((acc,item) => {
        return acc + item
    }, 0)

    await redis.set(key,JSON.stringify(totalAmmount),'EX', 600)

    return res.status(200).json({
        message: 'Got the Revenue',
        success: true,
        totalAmmount
    })

})