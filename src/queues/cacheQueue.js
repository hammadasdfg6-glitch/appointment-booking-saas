import { Queue, Worker } from "bullmq"
import redis from "../config/redis.js"
import { User } from "../models/user.model.js"
import Availability from "../models/availability.model.js"
import { Slots } from "../models/slots.model.js"
import { timeToMinutes, minutesToTime, formatDateString } from "../utils/timeUtilis.js"

export const cacheQueue = new Queue('cache-queue', { 
    connection: redis,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 10
    }
})

const cacheWorker = new Worker('cache-queue', async (job) => {
    console.log("Starting nightly cache warming for Availability...")

    
    const staffMembers = await User.find({ role: 'staff' })
    if (0 === staffMembers.length) return

    const SLOT_INTERVAL = 15
    const duration = 15 

    
    const today = new Date()
    //set today date and 12am
    today.setHours(0, 0, 0, 0) 

    for (let i = 0; 7 > i; i++) {
        const targetDate = new Date(today)
        targetDate.setDate(today.getDate() + i)
        
        // Converts date to 'YYYY-MM-DD' format
        const dateString = formatDateString(targetDate)
        // Gets Day of a week
        const dayOfWeek = targetDate.getDay()

        for (const staff of staffMembers) {
            const staffId = staff._id.toString()
            
            
            let existingSlots = await Slots.findOne({ staffId, date: targetDate })

            if (!existingSlots) {
                
                const avail = await Availability.findOne({ staffId, dayOfWeek })
                
                if (avail) {

                    const start = timeToMinutes(avail.startTime)
                    const end = timeToMinutes(avail.endTime)
                    const slotsArray = []

                    
                    for (let current = start; current + duration <= end; current += Math.max(duration, SLOT_INTERVAL)) {
                        slotsArray.push({
                            startTime: minutesToTime(current),
                            endTime: minutesToTime(current + duration),
                            status: 'available'
                        })
                    }

                    
                    if (0 < slotsArray.length) {
                        existingSlots = await Slots.create({
                            staffId,
                            date: targetDate,
                            slots: slotsArray
                        })
                    }
                }
            }

        }
    }
    
    console.log("Cache warming complete!")
}, { connection: redis })

export async function scheduleCacheWarming() {
    await cacheQueue.add('warm-availability', {}, {
        repeat: {
            cron: '0 0 * * *' 
        }
    })
}