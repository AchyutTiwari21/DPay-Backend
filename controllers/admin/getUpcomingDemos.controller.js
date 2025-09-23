import Lesson from "../../models/lesson.model.js";

// Fetch the latest 3 upcoming demo classes
export const getUpcomingDemos = async (req, res) => {
  try {
    // Find lessons with status CONFIRMED and date in the future
    const now = new Date();
    const lessons = await Lesson.find({
      status: "CONFIRMED",
      date: { $gte: now }
    })
    .sort({ date: 1 }) // soonest first
    .limit(3)
    .populate([
      { path: "student", select: "name" },
      { 
        path: "tutor", 
        populate: [
          { path: "user", select: "name" }, // Get tutor's name from User
        ]
      },
      { path: "subject", select: "name" } // Get subject name
    ]);

    // Format for frontend
    const demos = lessons.map((lesson) => ({
      id: lesson._id,
      subject: lesson.subject.name,
      tutor: lesson.tutor.user.name,
      student: lesson.student.name,
      date: `${lesson.date.toISOString().slice(0, 10)} ${lesson.time}`
    }));

    return res.json(demos);
  } catch (err) {
    console.log("Error fetching upcoming demos:", err.message); 
    return res.status(500).json({ error: "Failed to fetch upcoming demos" });
  }
};