import { TutorProfile, Subject } from "../../../models/index.js";
import { ApiResponse, asyncHandler } from "../../../utils/index.js";
import mongoose from "mongoose";

export const getTutors = asyncHandler(async (req, res) => {
    const { page = 1, limit = 7, search, language, minPrice, maxPrice } = req.query;

    try {
        let pipeline = [];

        // 🔹 Price Range filter
        if (minPrice && maxPrice) {
            pipeline.push({
                $match: {
                    pricePerHour: {
                        $gte: Number(minPrice),
                        $lte: Number(maxPrice)
                    }
                }
            });
        }

        // 🔹 Search filter (with scoring)
        if (search) {
            const regex = new RegExp(search, "i");

            // 1️⃣ Get matching subject IDs
            const subjectIds = await Subject.find({ $or: [
                { name: regex },
                { category: regex }
            ] }).distinct("_id");

            pipeline.push({
                $addFields: {
                    score: {
                        $add: [
                            { $cond: [{ $regexMatch: { input: "$title", regex } }, 1, 0] },
                            {
                                $cond: [
                                    {
                                        $gt: [
                                            {
                                                $size: {
                                                    $filter: {
                                                        input: "$skills",
                                                        as: "s",
                                                        cond: { $regexMatch: { input: "$$s", regex } }
                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    },
                                    3,
                                    0
                                ]
                            },
                            // 🔹 Replace search-language check with language query parameter
                            {
                            $cond: [
                                {
                                    $gt: [
                                        {
                                            $size: {
                                                $filter: {
                                                input: "$languages",
                                                as: "l",
                                                cond: language && language !== "any"
                                                    ? { $regexMatch: { input: "$$l", regex: new RegExp(language, "i") } } // ✅ use query param
                                                    : false
                                                }
                                            }
                                        },
                                        0
                                    ]
                                },
                                2,
                                0
                            ]
                            },
                            {
                            $cond: [
                                {
                                    $gt: [
                                        { $size: { $setIntersection: ["$subjects", subjectIds] } },
                                        0
                                    ]
                                },
                                4,
                                0
                            ]
                            }
                        ]
                    }
                }
                });

            // 3️⃣ Keep only tutors with score > 0
            pipeline.push({
                $match: { score: { $gt: 0 } }
            });

            // Sort by score first
            pipeline.push({ $sort: { score: -1, _id: 1 } });
        } else {
            // Default sort when no search term
            pipeline.push({ $sort: { _id: 1 } });
        }

        // 🔹 Lookup for user, subjects and availability
        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                    pipeline: [
                        { $project: { _id: 0, name: 1, avatar: 1 } }
                    ]
                }
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjects",
                    foreignField: "_id",
                    as: "subjects",
                    pipeline: [
                        { $project: { _id: 0, name: 1 } }
                    ]
                }
            },
            {
                $lookup: {
                    from: "availabilities",
                    localField: "availability",
                    foreignField: "_id",
                    as: "availability",
                    pipeline: [
                        { $project: { _id: 1, day: 1, timeslots: 1 } }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    name: "$user.name",
                    avatar: "$user.avatar",
                    title: 1,
                    subjects: "$subjects.name",
                    skills: 1,
                    languages: 1,
                    pricePerHour: 1,
                    rating: 1,
                    verified: 1,
                    mode: 1,
                    experience: 1,
                    classesTaken: 1,
                    availability: 1,
                    about: 1,
                    education: 1
                }
            }
        );

        // 🔹 Pagination (skip + limit)
        const pageNumber = Number(page) || 1;
        const perPage = Number(limit) || 7;
        const skip = (pageNumber - 1) * perPage;

        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: perPage });

        // Run query
        let tutors = await TutorProfile.aggregate(pipeline);

        // Count total docs (for frontend page calculation)
        const totalTutors = await TutorProfile.countDocuments();
        const totalPages = Math.ceil(totalTutors / perPage);

        return res.status(200).json(new ApiResponse(
            200,
            { tutors, totalTutors, totalPages, currentPage: pageNumber },
            "Tutors retrieved successfully"
        ));
    } catch (error) {
        console.error("Error retrieving tutors:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});

export const getTutorById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const pipeline = [
            // Match the specific tutor with new keyword
            { $match: { _id: new mongoose.Types.ObjectId(id) } },

            // Same lookups as getTutors
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                    pipeline: [
                        { $project: { _id: 0, name: 1, avatar: 1 } }
                    ]
                }
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjects",
                    foreignField: "_id",
                    as: "subjects",
                    pipeline: [
                        { $project: { _id: 0, name: 1 } }
                    ]
                }
            },
            {
                $lookup: {
                    from: "availabilities",
                    localField: "availability",
                    foreignField: "_id",
                    as: "availability",
                    pipeline: [
                        { $project: { _id: 1, day: 1, timeslots: 1 } }
                    ]
                }
            },

            // Project fields in the same format
            {
                $project: {
                    _id: 1,
                    name: "$user.name",
                    avatar: "$user.avatar",
                    title: 1,
                    subjects: "$subjects.name",
                    skills: 1,
                    languages: 1,
                    pricePerHour: 1,
                    rating: 1,
                    verified: 1,
                    mode: 1,
                    experience: 1,
                    classesTaken: 1,
                    availability: 1,
                    about: 1,
                    education: 1
                }
            }
        ];

        const [tutor] = await TutorProfile.aggregate(pipeline);

        if (!tutor) {
            return res.status(404).json(new ApiResponse(404, null, "Tutor not found"));
        }

        return res.status(200).json(new ApiResponse(
            200,
            tutor,
            "Tutor retrieved successfully"
        ));
    } catch (error) {
        console.error("Error retrieving tutor:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});
