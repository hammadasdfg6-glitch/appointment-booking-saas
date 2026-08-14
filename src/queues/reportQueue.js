import { Queue, Worker } from "bullmq";
import redis from "../config/redis.js";
import { emailJob } from "./emailQueue.js";
import { User } from "../models/user.model.js";
import { Booking } from "../models/booking.model.js";

export const reportQueue = new Queue("report-queue", { 
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 10
  }
});
const reportWorker = new Worker(
  "report-queue",
  async (job) => {
    const owners = await User.find({ role: "owner" });

    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < owners.length; i++) {
      const totalBookings = await Booking.countDocuments({
        orgId: owners[i].orgId,
        createdAt: { $gte: lastWeek },
      });
      const completedBookings = await Booking.countDocuments({
        orgId: owners[i].orgId,
        status: "completed",
        createdAt: { $gte: lastWeek },
      });
      const cancelledBookings = await Booking.countDocuments({
        orgId: owners[i].orgId,
        status: "cancelled",
        createdAt: { $gte: lastWeek },
      });

      await emailJob(
        owners[i].email,
        "Your Weekly Analytics Report",
        `Total Bookings: ${totalBookings}\nCompleted Bookings: ${completedBookings}\nCancelledBookings: ${cancelledBookings}`,
      );
      
    }
  },
  { connection: redis },
);

export async function scheduleWeeklyReports() {
  await reportQueue.add(
    "send-weekly-reports",
    {},
    {
      repeat: {
        cron: "0 0 * * 0",
      },
    },
  );
}
