import { Queue, Worker } from "bullmq";
import { sendMail } from "../services/email.service.js";
import redis from "../config/redis.js";

export const emailQueue = new Queue('email-queue', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: true, // Automatically delete completed jobs immediately
        removeOnFail: true,     // Automatically delete failed jobs immediately from Redis
    },
});

export async function emailJob(email, sub, body, options = {}) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        console.warn(`[emailQueue] Skipping emailJob with invalid address: "${email}"`);
        return;
    }
    await emailQueue.add('email-queue', {
        to: email,
        subject: sub,
        body: body,
    }, options);
}

export async function cleanFailedJobs() {
    try {
        const failedJobs = await emailQueue.getJobs(['failed']);
        for (const job of failedJobs) {
            await job.remove();
        }
        console.log(`[emailQueue] Cleaned up ${failedJobs.length} failed jobs.`);
        return failedJobs.length;
    } catch (err) {
        console.error('[emailQueue] Error cleaning failed jobs:', err.message);
        return 0;
    }
}

export const emailWorker = new Worker('email-queue', async (job) => {
    // Check if job has expired (older than 6 hours)
    if (job.timestamp && (Date.now() - job.timestamp > 6 * 60 * 60 * 1000)) {
        console.log(`[emailWorker] Job ${job.id} expired. Skipping.`);
        return { skipped: true, reason: 'expired' };
    }

    const { to, subject, body } = job.data;
    if (!to || typeof to !== 'string' || !to.includes('@')) {
        console.warn(`[emailWorker] Job ${job.id} had invalid recipient "${to}". Skipping.`);
        return { skipped: true, reason: 'invalid_recipient' };
    }

    const message = await sendMail(to, subject, body);
    return message;
}, {
    connection: redis,
    concurrency: 2,
    limiter: {
        max: 2,
        duration: 1000,
    },
});

emailWorker.on('completed', (job) => {
    console.log(`[emailWorker] Job ${job.id} completed for ${job.data?.to}`);
});

emailWorker.on('failed', async (job, err) => {
    console.error(`[emailWorker] Job ${job?.id} failed for ${job?.data?.to}:`, err.message);
    if (job) {
        try {
            await job.remove();
            console.log(`[emailWorker] Deleted failed job ${job.id} from queue.`);
        } catch (removeErr) {
            // Already removed by removeOnFail: true
        }
    }
});

emailWorker.on('error', (err) => {
    console.error('[emailWorker] Worker runtime error:', err.message);
});
