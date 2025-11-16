import { User, Lesson, TutorProfile, Notification, StudentProfile } from '../../models/index.js';
import { ApiResponse, asyncHandler } from '../../utils/index.js';
import { mailSender } from '../../utils/mailSender.js';


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

export async function getDemoStats(req, res) {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ message: 'Missing user id' })
    }

    const tutorProfile = await TutorProfile.findOne({ user: userId }).select('_id')
    if (!tutorProfile) {
      return res.status(404).json({ message: 'Tutor profile not found' })
    }

    const lessons = await Lesson.find({ tutor: tutorProfile._id })
      .select('date time status')
      .lean()

    const now = new Date()
    let upcoming = 0
    let completed = 0
    let cancelled = 0

    lessons.forEach((l) => {
      if (l.status === 'COMPLETED') completed++
      if (l.status === 'CANCELLED') cancelled++

      const dt = new Date(l.date)
      if (l.time) {
        const parts = l.time.split(':').map((p) => parseInt(p, 10))
        dt.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0)
      }
      if (dt > now && l.status === 'CONFIRMED') upcoming++
    })

    return res.status(200).json({
      success: true,
      stats: {
        totalDemos: lessons.length,
        upcomingDemos: upcoming,
        completedDemos: completed,
        cancelledDemos: cancelled
      }
    })
  } catch (err) {
    console.error('Error fetching demo stats:', err)
    return res.status(500).json({ message: 'Failed to fetch demo stats' })
  }
}

export const getDemoSessionsHandler = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    subject,
    status,
    dateFrom,
    dateTo
  } = req.query;

  // ensure authenticated tutor
  const userId =  req?.user?._id;
  if (!userId) {
    return res.status(400).json(new ApiResponse(400, null, "Missing user id"));
  }

  // find tutor profile
  const tutorProfile = await TutorProfile.findOne({ user: userId }).select('_id');
  if (!tutorProfile) {
    return res.status(404).json(new ApiResponse(404, null, "Tutor profile not found"));
  }

  try {
    const pageNumber = Number(page) || 1;
    const perPage = Number(limit) || 10;
    const skip = (pageNumber - 1) * perPage;
    const now = new Date();

    // base match - restrict to this tutor
    const pipeline = [
      {
        $match: {
          tutor: tutorProfile._id
        }
      }
    ];

    // date range filter
    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);
      pipeline.push({ $match: { date: dateFilter } });
    }

    // status filter (frontend sends lowercase like 'pending')
    if (status) {
      pipeline.push({ $match: { status: status.toUpperCase() } });
    }

    // lookups to populate student (user), student profile and subject
    pipeline.push(
      // student (user) details
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "studentDetails",
          pipeline: [
            { $project: { _id: 1, name: 1, email: 1, avatar: 1 } }
          ]
        }
      },
      { $unwind: { path: "$studentDetails", preserveNullAndEmptyArrays: true } },

      // student profile (phone, address, schoolBoard, rating)
      {
        $lookup: {
          from: "studentprofiles",
          localField: "student",
          foreignField: "user",
          as: "studentProfile",
          pipeline: [
            { $project: { phone: 1, address: 1, schoolBoard: 1, rating: 1 } }
          ]
        }
      },
      { $unwind: { path: "$studentProfile", preserveNullAndEmptyArrays: true } },

      // subject details
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subjectDetails",
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      { $unwind: { path: "$subjectDetails", preserveNullAndEmptyArrays: true } }
    );

    // search filter (student name or subject name)
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "studentDetails.name": { $regex: search, $options: "i" } },
            { "subjectDetails.name": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    // subject filter by name
    if (subject) {
      pipeline.push({
        $match: {
          "subjectDetails.name": subject
        }
      });
    }

    // project fields needed by frontend (table + drawer)
    pipeline.push({
      $project: {
        id: "$_id",
        student: {
          _id: "$studentDetails._id",
          name: "$studentDetails.name",
          email: "$studentDetails.email",
          avatar: "$studentDetails.avatar",
          phone: "$studentProfile.phone",
          address: "$studentProfile.address",
          rating: "$studentProfile.rating",
          schoolBoard: "$studentProfile.schoolBoard"
        },
        subject: "$subjectDetails.name",
        course: "$studentProfile.schoolBoard", // maps to "School Board" used in drawer
        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        rawDate: "$date",
        time: "$time",
        duration: 1, // not stored in model, placeholder (frontend can handle missing)
        price: 1,    // placeholder
        status: { $toLower: "$status" }, // convert to lowercase to match frontend checks
        meetingLink: 1,
        notes: 1,
        createdAt: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$createdAt" } }
      }
    });

    // get bookings (with pagination) and compute stats in parallel
    const [bookingsAgg, statsResults] = await Promise.all([
      Lesson.aggregate([
        ...pipeline,
        { $sort: { date: -1 } },
        { $skip: skip },
        { $limit: perPage }
      ]),
      Promise.all([
        // total matched before pagination
        Lesson.aggregate([...pipeline, { $count: "total" }]),
        // total lessons for this tutor (all time)
        Lesson.countDocuments({ tutor: tutorProfile._id }),
        // upcoming demos (date >= now)
        Lesson.countDocuments({ tutor: tutorProfile._id, date: { $gte: now } }),
        // completed sessions
        Lesson.countDocuments({ tutor: tutorProfile._id, status: "COMPLETED" }),
        // cancelled sessions
        Lesson.countDocuments({ tutor: tutorProfile._id, status: "CANCELLED" })
      ])
    ]);

    const totalAgg = statsResults[0];
    const totalMatched = totalAgg.length > 0 ? totalAgg[0].total : 0;
    const totalPages = Math.ceil(totalMatched / perPage);

    const [, totalCount, upcomingDemos, completed, cancelled] = statsResults;

    return res.status(200).json(new ApiResponse(
      200,
      {
        bookings: bookingsAgg,
        totalPages,
        currentPage: pageNumber,
        stats: {
          totalDemos: totalCount,
          total: totalMatched,
          upcomingDemos,
          completed,
          cancelled
        }
      },
      "Demo bookings retrieved successfully"
    ));
  } catch (err) {
    console.error("Error in getDemoSessionsHandler:", err);
    return res.status(500).json(new ApiResponse(500, null, "Failed to fetch demo bookings"));
  }
});

export const sendClassRequestNotification = asyncHandler(async (req, res) => {
  const userId =  req?.user?._id;
  if (!userId) {
    return res.status(400).json(new ApiResponse(400, null, "Missing user id"));
  }

  try {
    // find tutor profile
    const tutorProfile = await TutorProfile.findOne({ user: userId });
    if (!tutorProfile) {
      return res.status(404).json(new ApiResponse(404, null, "Tutor profile not found"));
    }

    const user = await User.findById(userId).select('name email');
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }
    
    const { lessonId } = req.body;
    if (!lessonId) {
      return res.status(400).json(new ApiResponse(400, null, "Missing lessonId in request body"));
    }
  
    const lesson = await Lesson.findById(lessonId)
    .populate('student', '_id name email')
    .populate('subject', 'name');
    if (!lesson) {
      return res.status(404).json(new ApiResponse(404, null, "Lesson not found"));
    }
    
    if(tutorProfile._id.toString() !== lesson.tutor.toString()) {
      return res.status(403).json(new ApiResponse(403, null, "Unauthorized: Tutor does not match lesson tutor"));
    }

    const student = await StudentProfile.findOne({user: lesson.student._id});

    const notification = new Notification({
      user: lesson.student._id,
      title: "New Class Request",
      message: `You have a new class request from ${user.name} for the subject ${lesson.subject.name}.`,
      type: "class-request",
      lesson: lesson._id
    });

    await notification.save();

    student.notifications.push(notification._id);

    if (!student) {
      return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
    }

    await student.save();

    await mailSender(lesson.student.email, "New Class Request", `Hello ${lesson.student.name},\n\nYou have received a new class request from ${user.name} for the subject ${lesson.subject.name}.\n\nPlease log in to your account to view and respond to the request.\n\nBest regards,\nDPay Team`);

    return res.status(201).json(new ApiResponse(201, notification, "Notification sent successfully"));
  } catch (error) {
    console.error("Error sending class request notification:", error);
    return res.status(500).json(new ApiResponse(500, null, "Failed to send notification"));
  }
});

export const addMeetingLinkHandler = asyncHandler(async (req, res) => {
  const userId =  req?.user?._id;
  if (!userId) {
    return res.status(400).json(new ApiResponse(400, null, "Missing user id"));
  }
  try {
    const { lessonId, meetingLink } = req.body;
    if (!lessonId || !meetingLink) {
      return res.status(400).json(new ApiResponse(400, null, "Missing lessonId or meetingLink in request body"));
    }
    // find tutor profile
    const tutorProfile = await TutorProfile.findOne({ user: userId });
    if (!tutorProfile) {
      return res.status(404).json(new ApiResponse(404, null, "Tutor profile not found"));
    }
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json(new ApiResponse(404, null, "Lesson not found"));
    }
    if(tutorProfile._id.toString() !== lesson.tutor.toString()) {
      return res.status(403).json(new ApiResponse(403, null, "Unauthorized: Tutor does not match lesson tutor"));
    }

    if(lesson.meetingLink) {
      return res.status(400).json(new ApiResponse(400, null, "Meeting link already exists for this lesson"));
    }

    lesson.meetingLink = meetingLink;
    await lesson.save();

    return res.status(200).json(new ApiResponse(200, null, "Meeting link added successfully"));
  } catch (error) {
    console.error("Error adding meeting link:", error);
    return res.status(500).json(new ApiResponse(500, null, "Failed to add meeting link"));
  }
});

export const markSessionComplete = asyncHandler(async (req, res) => {
  const userId =  req?.user?._id;
  if (!userId) {
    return res.status(400).json(new ApiResponse(400, null, "Missing user id"));
  }

  try {
    const { lessonId } = req.params;

    if(!lessonId) {
      return res.status(400).json(
        new ApiResponse(400, null, "Session Id is required.")
      );
    }

    const tutorProfile = await TutorProfile.findOne({user: userId});

    if(!tutorProfile) {
      return res.status(400).json(
        new ApiResponse(400, null, "No Tutor Profile found.")
      );
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json(new ApiResponse(404, null, "Session not found"));
    }
    if(tutorProfile._id.toString() !== lesson.tutor.toString()) {
      return res.status(403).json(new ApiResponse(403, null, "Unauthorized: Tutor does not match lesson tutor"));
    }

    lesson.status = "COMPLETED";
    await lesson.save();

    return res.status(200).json(
      new ApiResponse(200, null, "Status updated successfully!")
    );
  } catch (error) {
    console.error("Error while marking session complete.");
    return res.status(500).json(
      new ApiResponse(500, null, "Error while marking session complete.")
    );
  }
})
