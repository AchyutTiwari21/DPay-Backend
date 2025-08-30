import { TutorProfile, User } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";
import { mailSender } from "../../utils/mailSender.js";

export const addTutor = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    try {
        const tutorProfile = await TutorProfile.create({
            user: userId,
        });

        const user = await User.findByIdAndUpdate(userId, { $set: { role: "TUTOR" } });

        await mailSender(user.email, "Congratulations! You are now a tutor", `
            <p>Dear ${user.name},</p>
            <p>Congratulations! You have been successfully added as a tutor.</p>
            <p>We are excited to have you on board.</p>
        `);

        return res.status(201).json(
            new ApiResponse(true, null, "Tutor added successfully")
        );
    } catch (error) {
        console.log("Error adding tutor:", error.message);

        return res.status(500).json(new ApiResponse(false, null, "Error adding tutor", error.message));
    }
});
