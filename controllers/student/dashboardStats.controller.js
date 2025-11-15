import { StudentProfile } from '../../models/index.js';
import { asyncHandler } from '../../utils/index.js';

export const getStudentDashboardStats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user ID comes from auth middleware

    // Fetch student profile with populated references
    const studentProfile = await StudentProfile.findOne({ user: userId })
      .populate({
        path: 'tutions',
        select: '_id'
      })
      .populate({
        path: 'demoLessons',
        select: 'status date'
      });

    if (!studentProfile) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Total Classes (size of tutions array)
    const totalClasses = studentProfile.tutions.length;

    // Upcoming Demo Lessons (status: PENDING or CONFIRMED, date > now)
    const now = new Date();
    const upcomingDemoLessons = studentProfile.demoLessons.filter(lesson => 
      lesson.status && 
      (lesson.status === 'PENDING' || lesson.status === 'CONFIRMED') &&
      lesson.date > now
    );
    const upcomingDemoLessonsCount = upcomingDemoLessons.length;

    // Completed Demo Lessons (status: COMPLETED, date < now)
    const completedDemoLessons = studentProfile.demoLessons.filter(lesson =>
      lesson.status === 'COMPLETED'
    );
    const completedDemoLessonsCount = completedDemoLessons.length;

    // Average Rating
    const averageRating = studentProfile.rating || 0;

    return res.json({
      totalClasses,
      upcomingDemoLessons: upcomingDemoLessonsCount,
      completedDemoLessons: completedDemoLessonsCount,
      averageRating
    });
  } catch (err) {
    console.error('Student dashboard stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch student dashboard stats' });
  }
});
