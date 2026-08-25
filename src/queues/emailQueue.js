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
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400, count: 50 },
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
    concurrency: 5,
});

emailWorker.on('completed', (job) => {
    console.log(`[emailWorker] Job ${job.id} completed for ${job.data?.to}`);
});

emailWorker.on('failed', (job, err) => {
    console.error(`[emailWorker] Job ${job?.id} failed for ${job?.data?.to}:`, err.message);
});

emailWorker.on('error', (err) => {
    console.error('[emailWorker] Worker runtime error:', err.message);
});
