import mongoose from "mongoose";
import { asyncHandler, ApiResponse } from "../../utils/index.js";
import { TutorProfile } from "../../models/index.js";

export const getTutor = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    try {
        const pipeline = [
            // Match the specific tutor with new keyword
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
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
                    phone: 1,
                    address: 1,
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
                    education: 1,
                    availableLocations: 1
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
