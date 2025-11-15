import StudentProfile from '../../models/studentProfile.model.js';
import { asyncHandler, ApiResponse } from '../../utils/index.js';

const fetchUpcomingDemoLesson = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id ?? req.user?.id;
    if (!userId) return res.status(401).json(
        new ApiResponse(401, null, 'Unauthorized')
    );

    // Start of today to include lessons scheduled for today (and future)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let pipeline = [
      // Match student's demoLessons
      {
        $match: {
          user: userId
        }
      },
      // Unwind demoLessons array
      {
        $unwind: "$demoLessons"
      },
      // Lookup lesson details
      {
        $lookup: {
          from: "lessons",
          localField: "demoLessons",
          foreignField: "_id",
          as: "lessonDetails",
          pipeline: [
            {
              $match: {
                date: { $gte: todayStart },
                status: { $in: ['PENDING', 'CONFIRMED'] }
              }
            },
            // Lookup subject details
            {
              $lookup: {
                from: "subjects",
                localField: "subject",
                foreignField: "_id",
                as: "subject",
                pipeline: [
                  { $project: { name: 1 } }
                ]
              }
            },
            { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },
            // Lookup tutor -> user (to get tutor name)
            {
              $lookup: {
                from: "tutorprofiles",
                localField: "tutor",
                foreignField: "_id",
                as: "tutor",
                pipeline: [
                  {
                    $lookup: {
                      from: "users",
                      localField: "user",
                      foreignField: "_id",
                      as: "user",
                      pipeline: [
                        { $project: { name: 1 } }
                      ]
                    }
                  },
                  { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                  { $project: { tutorName: "$user.name" } }
                ]
              }
            },
            { $unwind: { path: "$tutor", preserveNullAndEmptyArrays: true } },
            // Project required fields only
            {
              $project: {
                _id: 1,
                subject: "$subject.name",
                date: 1,
                time: 1,
                teacher: "$tutor.tutorName",
                meetingLink: 1
              }
            }
          ]
        }
      },
      { $unwind: { path: "$lessonDetails", preserveNullAndEmptyArrays: true } },
      // Filter out null lesson details and sort by date
      {
        $match: {
          "lessonDetails._id": { $exists: true }
        }
      },
      // Sort by date ascending
      {
        $sort: { "lessonDetails.date": 1 }
      },
      // Replace root to return only lesson details
      {
        $replaceRoot: { newRoot: "$lessonDetails" }
      }
    ];

    const upcomingLessons = await StudentProfile.aggregate(pipeline);

    return res.status(200).json(     
        new ApiResponse(200, upcomingLessons, 'Upcoming demo lessons fetched successfully')
    );
   } catch (err) {
    console.error('fetchUpcomingDemoLesson error:', err);
    return res.status(500).json(
        new ApiResponse(500, null, 'Internal Server Error')
    );
  }
});

export default fetchUpcomingDemoLesson;