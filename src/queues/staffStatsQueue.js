import redis from "../config/redis.js";
import { Queue } from "bullmq";
import { Worker } from "bullmq";
import { User } from "../models/user.model.js";
import { Booking } from "../models/booking.model.js";

const statsCalculator = new Queue(`staff-stats`,{
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
        const todayStats = {}
        const cacheKey = `staff-stats:${Staff[i]._id}`
        if(cacheKey) await redis.del(cacheKey)
        const currentDate = new Date().toISOString().split("T")[0];
        todayStats.totalBookings = await Booking.countDocuments({staffId: Staff[i]._id,date: currentDate})
        todayStats.pendingBookings = todayStats.totalBookings
        todayStats.completedBookings = 0
        todayStats.cancelledBookings = await Booking.countDocuments({staffId: Staff[i]._id,date: currentDate, status: 'cancelled'})
        await redis.set(cacheKey, JSON.stringify(todayStats))
    }
    
}, {connection: redis})

export async function staffStatsReset(params) {
    await statsCalculator.add(`staff-stats`,{},{
        repeat: {
            cron: '0 0 * * *' 
        }
    })
}