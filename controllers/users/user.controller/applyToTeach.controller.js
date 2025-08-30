import { ApplyTeacherRequest } from "../../../models/index.js";
import { asyncHandler, ApiResponse } from "../../../utils/index.js";

export const applyTeach = asyncHandler(async (req, res) => {
    
    const user = req.user;

    if(!user) {
        return res.status(401).json(
            new ApiResponse(
                401,
                null,
                "User not found"
            )
        );
    }

    const { demoVideo, subjectToTeach, qualifications, experience, resume } = req.body;

    try {
        const newApplication = await ApplyTeacherRequest.create({
            user: user._id,
            demoVideo,
            subjectToTeach,
            qualifications,
            experience,
            resume
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                newApplication,
                "Application for teaching submitted successfully."
            )
        );
    } catch (error) {
        console.error("Error applying to teach:", error.message);
        return res.status(500).json(
            new ApiResponse(
                500,
                null,
                "Internal Server Error"
            )
        );
    }
});