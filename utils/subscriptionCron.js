import cron from 'node-cron';
import StudentProfile from '../models/studentProfile.model.js';

export const startSubscriptionCheck = () => {
  // Runs every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      await StudentProfile.updateMany(
        { isSubscribed: true, subscriptionExpiresAt: { $lt: new Date() } },
        { isSubscribed: false }
      );
    } catch (error) {
      console.error("❌ Subscription check error:", error.message);
    }
  });
};