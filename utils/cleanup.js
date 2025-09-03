import { Lesson, Payment } from "../models/index.js";

export const startCleanupJob = () => {
  setInterval(async () => {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);

    await Lesson.updateMany(
      { status: "PENDING", createdAt: { $lt: cutoff } },
      { $set: { status: "EXPIRED" } }
    );

    await Payment.updateMany(
      { status: "PENDING", createdAt: { $lt: cutoff } },
      { $set: { status: "EXPIRED" } }
    );
  }, 5 * 60 * 1000);
};