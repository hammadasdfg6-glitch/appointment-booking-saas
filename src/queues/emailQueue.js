import { Queue, Worker} from "bullmq";
import { sendMail } from "../services/email.service.js";
import redis from "../config/redis.js";

export const emailQueue = new Queue('email-queue', {
    connection: redis,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 50 // Keep the last 50 failed jobs for debugging purposes
    }
})

export async function emailJob(email, sub, body, options = {}) {
    await emailQueue.add('email-queue', {
        to: email,
        subject: sub,
        body: body
    }, options)
}

const emailWorker = new Worker('email-queue',async (job) =>{
    console.log("Entered Worker")
    
    // Check if job has expired (older than 3 hours)
    if (Date.now() - job.timestamp > 3 * 60 * 60 * 1000) {
        console.log(`Job ${job.id} expired. Skipping email.`);
        return;
    }

    const {to,subject,body} = job.data

    const message = await sendMail(to,subject,body)
    return message;
},{connection: redis})
