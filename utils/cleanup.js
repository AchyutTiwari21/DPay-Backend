import cron from "node-cron";
import { Lesson, Payment } from "../models/index.js";

export const startCleanupJob = () => {
  // Run every 5 minutes
  cron.schedule("*/1 * * * *", async () => {
    try {
      const cutoff = new Date(Date.now() - 15 * 60 * 1000); // 15 min ago

      await Lesson.updateMany(
        { status: "PENDING", createdAt: { $lt: cutoff } },
        { $set: { status: "EXPIRED" } }
      );

      await Payment.updateMany(
        { status: "PENDING", createdAt: { $lt: cutoff } },
        { $set: { status: "EXPIRED" } }
      );
    } catch (err) {
      console.error("❌ Cleanup job error:", err.message);
    }
  });
};
