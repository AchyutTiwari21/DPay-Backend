import { StudentProfile, TutorProfile } from '../../models/index.js';
import { asyncHandler } from '../../utils/index.js';

// Helper to get month name short
function getMonthShortName(monthIndex) {
  return [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ][monthIndex];
}

export const getDashboardGrowth = asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    const growthData = [];

    // Loop for last 12 months
    for (let i = 11; i >= 0; i--) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      // Handle year change
      const date = new Date(year, month, 1);
      const nextMonth = new Date(year, month + 1, 1);

      // Students registered in this month
      const students = await StudentProfile.countDocuments({
        createdAt: { $gte: date, $lt: nextMonth }
      });

      // Tutors registered in this month
      const tutors = await TutorProfile.countDocuments({
        createdAt: { $gte: date, $lt: nextMonth }
      });

      growthData.push({
        name: getMonthShortName(date.getMonth()),
        students,
        tutors
      });
    }

    return res.json({ growthData });
  } catch (err) {
    console.error('Dashboard growth error:', err);
    return res.status(500).json({ error: 'Failed to fetch growth data' });
  }
});