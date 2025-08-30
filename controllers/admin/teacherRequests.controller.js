import { ApplyTeacherRequest, TutorProfile, User } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";
import { mailSender } from "../../utils/mailSender.js";

export const getAllTeacherRequests = asyncHandler(async (req, res) => {
    try {
        const requests = await ApplyTeacherRequest.find().populate("user", "name email profileImg");
        res.status(200).json(
            new ApiResponse(true, requests, "Teacher requests fetched successfully")
        );
    } catch (error) {
        res.status(500).json(new ApiResponse(false, null, "Error fetching teacher requests", error.message));
    }
});

export const updateTeacherRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updatedRequest = await ApplyTeacherRequest.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate("user", "name email profileImg");

        if (!updatedRequest) {
            return res.status(404).json(
                new ApiResponse(false, null, "Teacher request not found")
            );
        }

        if(status == "ACCEPTED") {
            await TutorProfile.create({
                user: updatedRequest.user._id,
                experience: updatedRequest.experience,
            });

            const user = await User.findByIdAndUpdate(updatedRequest.user._id, { $set: { role: "TUTOR" } });

            await mailSender(user.email, "Congratulations! Your application has been accepted", `
                <p>Dear ${user.name},</p>
                <p>Congratulations! Your application to become a tutor has been accepted.</p>
                <p>We are excited to have you on board.</p>
            `);
        } else if(status == "REJECTED") {
            await mailSender(updatedRequest.user.email, "Application Update", `
                <p>Dear ${updatedRequest.user.name},</p>
                <p>We regret to inform you that your application to become a tutor has been rejected.</p>
                <p>Thank you for your interest, and we encourage you to apply again in the future.</p>
            `);
        }

        return res.status(200).json(
            new ApiResponse(true, null, "Teacher request updated successfully")
        );
    } catch (error) {
        console.log("Error updating teacher request:", error.message);

        return res.status(500).json(new ApiResponse(false, null, "Error updating teacher request", error.message));
    }
});
