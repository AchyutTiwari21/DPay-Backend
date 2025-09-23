import User from "../../models/user.model.js";

export const getLatestStudents = async (req, res) => {
  try {
    // Find latest 3 students by createdAt, role: "STUDENT"
    const students = await User.find({ role: "STUDENT" })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("name email createdAt");

    // Format as required by frontend
    const formatted = students.map((student, idx) => ({
      id: student._id.toString(),
      name: student.name,
      email: student.email,
      date: student.createdAt.toISOString().slice(0, 10), // "YYYY-MM-DD"
    }));

    return res.status(200).json({ students: formatted });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch latest students" });
  }
};