import TutorProfile from "../../models/tutorProfile.model.js";

export const getDashboardStats = async (req, res) => {
  try {
    const tutorId = req.user._id; // Assuming user ID is available from auth middleware

    // Get tutor profile with populated demo lessons and tutions
    const tutorProfile = await TutorProfile.findOne({ user: tutorId })
      .populate({
        path: 'demoLessons',
        model: 'Lesson',
        select: 'date time status'
      })
      .populate({
        path: 'tutions',
        model: 'Tution',
        select: 'status'
      });

    if (!tutorProfile) {
      return res.status(404).json({ 
        success: false, 
        message: "Tutor profile not found" 
      });
    }

    // Calculate total students
    const totalStudents = tutorProfile.students.length;

    // Calculate upcoming demos
    const currentDate = new Date();
    const upcomingDemos = tutorProfile.demoLessons.filter(demo => {
      const demoDateTime = new Date(demo.date);
      demoDateTime.setHours(...demo.time.split(':'));
      return demoDateTime > currentDate && demo.status === "CONFIRMED";
    }).length;

    // Calculate active classes
    const activeClasses = tutorProfile.tutions.filter(tution => 
      ["CONFIRMED", "ONGOING"].includes(tution.status)
    ).length;

    // Return stats
    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        upcomingDemos,
        activeClasses
      }
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching dashboard statistics",
      error: error.message 
    });
  }
};