import Lesson from '../../models/lesson.model.js'

export async function getDemoSessions(req, res) {
  try {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const lessons = await Lesson.find({ date: { $gte: startOfToday } })
      .sort({ date: 1 }) // ascending by date
      .limit(3)
      .populate({ path: 'student', select: 'name' })
      .populate({ path: 'subject', select: 'name' })
      .lean()

    const sessions = lessons.map((l) => ({
      id: l._id,
      // title formatted to match TutorHome expectation: "<Subject> - <StudentName>"
      title: `${l.subject?.name} Demo Session - ${l.student?.name}`,
      date: l.date, // ISO string (lean() returns plain object with Date -> will serialize)
      time: l.time,
    }))

    return res.status(200).json({ sessions })
  } catch (err) {
    console.error('Error fetching demo sessions:', err)
    return res.status(500).json({ message: 'Failed to fetch demo sessions' })
  }
}

export async function getBookingTrends(req, res) {
  try {
    const now = new Date()
    const bookings = []

    // Build counts for the last 12 months (oldest -> newest)
    for (let i = 11; i >= 0; i--) {
      const year = now.getFullYear()
      const month = now.getMonth() - i
      const startOfMonth = new Date(year, month, 1)
      const startOfNextMonth = new Date(year, month + 1, 1)

      // Count lessons scheduled in this month
      const count = await Lesson.countDocuments({
        date: { $gte: startOfMonth, $lt: startOfNextMonth }
      })

      bookings.push(count)
    }

    return res.status(200).json({ bookings })
  } catch (err) {
    console.error('Error fetching booking trends:', err)
    return res.status(500).json({ message: 'Failed to fetch booking trends' })
  }
}