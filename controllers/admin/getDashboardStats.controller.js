const { StudentProfile, TutorProfile, Course, Payment } = require('../../models'); // Adjust path as needed

/**
 * GET /api/admin/dashboard-stats
 * Returns stats for admin dashboard: total students, tutors, active courses, earnings this month,
 * and their percentage change from last month.
 */
const getDashboardStats = async (req, res) => {
  try {
    // Helper: Get start/end of current and last month
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total Students
    const totalStudents = await Student.countDocuments();
    const studentsLastMonth = await Student.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }
    });

    // Total Tutors
    const totalTutors = await Tutor.countDocuments();
    const tutorsLastMonth = await Tutor.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }
    });

    // Active Courses
    const activeCourses = await Course.countDocuments({ active: true });
    const activeCoursesLastMonth = await Course.countDocuments({
      active: true,
      updatedAt: { $gte: startOfLastMonth, $lt: endOfLastMonth }
    });

    // Earnings This Month
    const earningsThisMonthAgg = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfThisMonth, $lt: now },
          status: 'completed'
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
          status: 'completed'
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

    res.json({
      totalStudents,
      studentsChange: percentChange(totalStudents, totalStudents - studentsLastMonth),
      totalTutors,
      tutorsChange: percentChange(totalTutors, totalTutors - tutorsLastMonth),
      activeCourses,
      activeCoursesChange: percentChange(activeCourses, activeCoursesLastMonth),
      earningsThisMonth,
      earningsChange: percentChange(earningsThisMonth, earningsLastMonth)
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

module.exports = getDashboardStats;