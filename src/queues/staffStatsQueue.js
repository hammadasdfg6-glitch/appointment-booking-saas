import redis from "../config/redis.js";
import { Queue } from "bullmq";
import { Worker } from "bullmq";
import { User } from "../models/user.model.js";
import { Booking } from "../models/booking.model.js";

const todayStatsCalculator = new Queue(`staff-stats`,{
        connection: redis,
        defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: 10
        }
})

const staffStatsWorker = new Worker(`staff-stats`,async(job) => {
    console.log(`Staff Stats Calculator is Calculating`)
    const Staff = await User.find({role: 'staff'})

    if(0 === Staff.length) return

    for(let i=0; i<Staff.length;i++){
        const weeklyStats = JSON.parse(await redis.get(`weekly-stats:${Staff[i]._id}`))
        const monthlyStats = JSON.parse(await redis.get(`monthly-stats:${Staff[i]._id}`))
        const cacheKey = `staff-stats:${Staff[i]._id}`
        const oldTomorrowStats = await redis.get(cacheKey)
        if(oldTomorrowStats){
        
            if(weeklyStats){
            const todayStats = JSON.parse(oldTomorrowStats)
            weeklyStats.totalBookings += todayStats.totalBookings
            weeklyStats.completedBookings += todayStats.completedBookings
            weeklyStats.cancelledBookings += todayStats.cancelledBookings
            await redis.set(`weekly-stats:${Staff[i]._id}`,JSON.stringify(weeklyStats))
        }
        if(monthlyStats){
            const todayStats = JSON.parse(oldTomorrowStats)
            monthlyStats.totalBookings += todayStats.totalBookings
            monthlyStats.completedBookings += todayStats.completedBookings
            monthlyStats.cancelledBookings += todayStats.cancelledBookings
            await redis.set(`monthly-stats:${Staff[i]._id}`,JSON.stringify(monthlyStats))  
        }
        await redis.del(cacheKey)
        }
        const currentDate = new Date().toISOString().split("T")[0];
        const todayStats = {}
        todayStats.totalBookings = await Booking.countDocuments({staffId: Staff[i]._id,date: currentDate})
        todayStats.pendingBookings = todayStats.totalBookings
        todayStats.completedBookings = await Booking.countDocuments({staffId: Staff[i]._id,date: currentDate, status: 'completed'})
        todayStats.cancelledBookings = await Booking.countDocuments({staffId: Staff[i]._id,date: currentDate, status: 'cancelled'})
        await redis.set(cacheKey, JSON.stringify(todayStats))
        if(!weeklyStats){
            const weekStats = {}
            weekStats.totalBookings = todayStats.totalBookings
            weekStats.completedBookings = todayStats.completedBookings
            weekStats.cancelledBookings = todayStats.cancelledBookings
            await redis.set(`weekly-stats:${Staff[i]._id}`,JSON.stringify(weekStats))            
        }
        if(!monthlyStats){
            const monthStats = {}
            monthStats.totalBookings = todayStats.totalBookings
            monthStats.completedBookings = todayStats.completedBookings
            monthStats.cancelledBookings = todayStats.cancelledBookings
            await redis.set(`monthly-stats:${Staff[i]._id}`,JSON.stringify(monthStats)) 
        }
    }
    
}, {connection: redis})

const weeklyStatsReseter = new Queue(`weekly-stats`,{
    connection: redis,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 10
    }
})

const weeklyWorker = new Worker(`weekly-stats`,async(job) => {
    console.log(`Weekly Stats are resetting`)
    const Staff = await User.find({role: 'staff'})
    
    if(0 === Staff.length) return

    for(let i = 0; i < Staff.length; i++){
        const key = `weekly-stats:${Staff[i]._id}`
        const cacheKey = await redis.get(key)
        if(cacheKey) await redis.del(key)
        }
        return
}, {connection: redis})

const monthlyStatsResetter = new Queue(`monthly-stats`,{
    connection: redis,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 10
    }
})

const monthlyWorker = new Worker(`monthly-stats`,async (job) => {
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (tomorrow.getDate() !== 1) {
        return;
    }

    console.log(`Monthly Stats are resetting`)
    const Staff = await User.find({role: 'staff'})

    if(0 === Staff.length) return

    for(let i = 0; i < Staff.length; i++){
        const key = `monthly-stats:${Staff[i]._id}`
        const cacheKey = await redis.get(key)
        if(cacheKey) await redis.del(key)
        }
    return
}, {connection: redis})

export async function monthlyStatsReset() {
    await monthlyStatsResetter.add(`monthly-stats`,{},{
        repeat: {
            cron: '30 23 * * *'
        }
    })
}

export async function weeklyStatsReset() {
    await weeklyStatsReseter.add(`weekly-stats`,{},{
        repeat: {
            cron: '0 11 * * 0'
        }
    })
}

export async function staffStatsReset() {
    await todayStatsCalculator.add(`staff-stats`,{},{
        repeat: {
            cron: '0 0 * * *' 
        }
    })
}