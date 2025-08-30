import { TutorProfile, User, Subject } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";
import { mailSender } from "../../utils/mailSender.js";

export const addTutor = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    try {
        await TutorProfile.create({
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

export const addSubject = asyncHandler(async (req, res) => {
    const { name, category } = req.body;

    try {
        await Subject.create({ name, category });
        return res.status(201).json(
            new ApiResponse(201, null, "Subject added successfully")
        );
    } catch (error) {
        console.error("Error adding subject:", error.message);
        return res.status(500).json(
            new ApiResponse(500, null, "Internal Server Error")
        );
    }
});
