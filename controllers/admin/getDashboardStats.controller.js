import { StudentProfile, TutorProfile, Tution, Payment } from '../../models/index.js';
import { asyncHandler } from '../../utils/index.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Helper: Get start/end of current and last month
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total Students
    const totalStudents = await StudentProfile.countDocuments();

    // Total Tutors
    const totalTutors = await TutorProfile.countDocuments();

    // Active Tutions
    const activeTutions = await Tution.countDocuments({ status: { $in: ["ONGOING", "CONFIRMED"] } });

    // Earnings This Month
    const earningsThisMonthAgg = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfThisMonth, $lt: now },
          status: 'PAID'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);
    const earningsThisMonth = earningsThisMonthAgg[0]?.total || 0;

    // Earnings Last Month
    const earningsLastMonthAgg = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth },
          status: 'PAID'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);
    const earningsLastMonth = earningsLastMonthAgg[0]?.total || 0;

    // Percentage change helpers
    function percentChange(current, prev) {
      if (prev === 0) return current === 0 ? 0 : 100;
      return ((current - prev) / prev) * 100;
    }

    return res.json({
      totalStudents,
      totalTutors,
      activeTutions,
      earningsThisMonth,
      earningsChange: percentChange(earningsThisMonth, earningsLastMonth)
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});
