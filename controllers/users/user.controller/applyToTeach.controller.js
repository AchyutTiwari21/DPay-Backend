import { ApplyTeacherRequest } from "../../../models/index.js";
import { asyncHandler, ApiResponse } from "../../../utils/index.js";
import { mailSender } from "../../../utils/mailSender.js";

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

    const { demoVideo, subjectsToTeach, qualifications, experience, resume } = req.body;

    try {
        const newApplication = await ApplyTeacherRequest.create({
            user: user._id,
            demoVideo,
            subjectsToTeach,
            qualifications,
            experience,
            resume
        });

        await mailSender(process.env.ADMIN_EMAIL, 'New Teacher Application', 
            `<p>A new teacher application has been submitted.</p>
            <p><strong>User:</strong> ${user.name} (${user.email})</p>
            <p><strong>Demo Video:</strong> ${demoVideo}</p>
            <p><strong>Subjects to Teach:</strong> ${subjectsToTeach}</p>
            <p><strong>Qualifications:</strong> ${qualifications}</p>
            <p><strong>Experience:</strong> ${experience}</p>
            <p><strong>Resume:</strong> ${resume}</p>`
        );

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