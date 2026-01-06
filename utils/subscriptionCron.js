import cron from 'node-cron';
import { StudentProfile, TutorProfile } from '../models/index.js';

export const startSubscriptionCheck = () => {
  // Runs every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      await StudentProfile.updateMany(
        { isSubscribed: true, subscriptionExpiresAt: { $lt: new Date() } },
        { isSubscribed: false }
      );

      await TutorProfile.updateMany(
        { isSubscribed: true, subscriptionExpiresAt: { $lt: new Date() } },
        { isSubscribed: false }
      );
    } catch (error) {
      console.error("❌ Subscription check error:", error.message);
    }
  });
};