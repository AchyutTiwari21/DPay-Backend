import { asyncHandler, ApiResponse } from "../../utils/index.js";
import { Lesson } from "../../models/index.js";
import mongoose from "mongoose";

export const getUpcomingDemoBookings = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 7, 
        search, 
        subject,
        tutor,
        status,
        dateFrom,
        dateTo 
    } = req.query;

    try {
        const pageNumber = Number(page) || 1;
        const perPage = Number(limit) || 10;
        const skip = (pageNumber - 1) * perPage;

        const now = new Date();
        let pipeline = [];

        // Match stage for demo lessons
        pipeline.push({
            $match: {
                status: { $in: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] }
            }
        });

        // Date range filter
        if (dateFrom || dateTo) {
            let dateFilter = {};
            if (dateFrom) dateFilter.$gte = new Date(dateFrom);
            if (dateTo) dateFilter.$lte = new Date(dateTo);
            pipeline.push({ $match: { date: dateFilter } });
        }

        // Status filter
        if (status) {
            pipeline.push({
                $match: { status: status.toUpperCase() }
            });
        }

        // Lookup stages for populating references
        pipeline.push(
            // Lookup student details
            {
                $lookup: {
                    from: "users",
                    localField: "student",
                    foreignField: "_id",
                    as: "studentDetails",
                    pipeline: [
                        { $project: { _id: 1, name: 1, email: 1 } }
                    ]
                }
            },
            { $unwind: "$studentDetails" },

            // Lookup tutor details
            {
                $lookup: {
                    from: "tutorprofiles",
                    localField: "tutor",
                    foreignField: "_id",
                    as: "tutorDetails",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "user",
                                foreignField: "_id",
                                as: "user",
                                pipeline: [{ $project: { name: 1 } }]
                            }
                        },
                        { $unwind: "$user" },
                        { $project: { "user.name": 1 } }
                    ]
                }
            },
            { $unwind: "$tutorDetails" },

            // Lookup subject details
            {
                $lookup: {
                    from: "subjects",
                    localField: "subject",
                    foreignField: "_id",
                    as: "subjectDetails",
                    pipeline: [{ $project: { name: 1 } }]
                }
            },
            { $unwind: "$subjectDetails" }
        );

        // Search filter
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { "studentDetails.name": { $regex: search, $options: "i" } },
                        { "tutorDetails.user.name": { $regex: search, $options: "i" } }
                    ]
                }
            });
        }

        // Subject filter
        if (subject) {
            pipeline.push({
                $match: {
                    "subjectDetails.name": subject
                }
            });
        }

        // Tutor filter
        if (tutor) {
            pipeline.push({
                $match: {
                    tutor: new mongoose.Types.ObjectId(tutor)
                }
            });
        }

        // Project stage to format output
        pipeline.push({
            $project: {
                id: "$_id",
                studentId: "$studentDetails._id",
                student: "$studentDetails.name",
                tutorId: "$tutor",
                tutor: "$tutorDetails.user.name",
                subject: "$subjectDetails.name",
                date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                time: "$time",
                status: "$status"
            }
        });

        const [bookings, statsResults] = await Promise.all([
            // Main bookings query
            Lesson.aggregate([...pipeline, { $skip: skip }, { $limit: perPage }]),

            // Stats queries using Promise.all
            Promise.all([
                // Total bookings count using the same pipeline before pagination
                Lesson.aggregate([...pipeline, { $count: "total" }]),

                // Total bookings
                Lesson.countDocuments(),

                // Upcoming demos count
                Lesson.countDocuments({
                    date: { $gte: now }
                }),

                // Completed sessions count
                Lesson.countDocuments({
                    status: 'COMPLETED'
                }),

                // Cancelled sessions count
                Lesson.countDocuments({
                    status: 'CANCELLED'
                })
            ])
        ]);

        // Destructure and handle the aggregation count properly
        const [totalAgg, totalCount, upcomingDemos, completed, cancelled] = statsResults;

        // If totalAgg is empty, that means there were no matches
        const total = totalAgg.length > 0 ? totalAgg[0].total : 0;
        
        // Calculate pagination metadata
        const totalPages = Math.ceil(total / perPage);


        return res.status(200).json(new ApiResponse(
            200,
            {
                bookings,
                totalPages,
                currentPage: pageNumber,
                stats: {
                    totalDemos: totalCount,
                    total: total,
                    upcomingDemos: upcomingDemos,
                    completed: completed,
                    cancelled: cancelled
                }
            },
            "Demo bookings and stats retrieved successfully"
        ));

    } catch (error) {
        console.error("Error retrieving demo bookings:", error.message);
        return res.status(500).json(new ApiResponse(
            500,
            null,
            "Internal Server Error"
        ));
    }
});
