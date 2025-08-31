import { TutorProfile, Subject } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";

export const getTutorProfile = asyncHandler(async (req, res) => {
    const user = req.user;

    try {
        const profile = await TutorProfile.findOne({ user: user._id }).populate("user", "name email profileImg");

        if (!profile) {
            return res.status(404).json(new ApiResponse(false, null, "Tutor profile not found"));
        }

        return res.status(200).json(new ApiResponse(true, profile, "Tutor profile retrieved successfully"));
    } catch (error) {
        console.error("Error retrieving tutor profile:", error.message);
        return res.status(500).json(new ApiResponse(false, null, "Internal Server Error"));
    }
});

export const updateTutorProfile = asyncHandler(async (req, res) => {
    const user = req.user;

    const { about, modeOfClass, experience, skills, languages, title, subjects, hourlyRate } = req.body;

    try {
        const subjectIds = await Subject.find({ name: { $in: subjects } }).distinct("_id");

        const updatedProfile = await TutorProfile.findOneAndUpdate(
            { user: user._id },
            { about, modeOfClass, experience, skills, languages, title, subjects: subjectIds, hourlyRate },
            { new: true }
        );

        if (!updatedProfile) {
            return res.status(404).json(
                new ApiResponse(404, null, "Tutor profile not found")
            );
        }

        return res.status(200).json(
            new ApiResponse(200, null, "Tutor profile updated successfully")
        );
    } catch (error) {
        console.error("Error updating tutor profile:", error.message);
        return res.status(500).json(
            new ApiResponse(500, null, "Internal Server Error")
        );
    }
});
