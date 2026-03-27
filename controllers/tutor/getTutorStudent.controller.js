import { asyncHandler, ApiResponse } from "../../utils/index.js";
import { TutorProfile } from "../../models/index.js";

export const getTutorStudents = asyncHandler(async (req, res) => {
    try {
        const userId = req?.user?._id;
        if(!userId) {
            return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
        }
        const tutorProfile = await TutorProfile.findOne({ user: userId }).populate({    
            path: "students",
            select: "user",
            populate: {
                path: "user",
                select: "name email avatar phone",
            }
        });
        if(!tutorProfile) {
            return res.status(404).json(new ApiResponse(404, null, "Tutor profile not found"));
        }
        return res.status(200).json(new ApiResponse(200, tutorProfile.students, "Students retrieved successfully"));
    } catch (error) {
        console.error("Error fetching tutor students:", error);
        return res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});

