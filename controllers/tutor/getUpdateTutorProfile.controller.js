import { User, TutorProfile, Subject } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

export const getTutorProfile = asyncHandler(async (req, res) => {
    const user = req.user;

    try {
        const profile = await TutorProfile.findOne({ user: user._id }).populate("user", "name email").populate("subjects", "name category").populate("availability");

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

    const { phone, address, about, mode, education, experience, classesTaken, skills, languages, title, subjects, pricePerHour, availableLocations } = req.body;

    try {
        let classesTakenNum;
        if(classesTaken) {
            classesTakenNum = Number(classesTaken);
        }
        let pricePerHourNum;
        if(pricePerHour) {
            pricePerHourNum = Number(pricePerHour);
        }

        let subjectIds;
        if (subjects && Array.isArray(subjects)) {
            subjectIds = await Subject.find({ name: { $in: subjects } }).select('_id');
        }

        const updatedProfile = await TutorProfile.findOneAndUpdate(
            { user: user._id },
            { phone, address, about, mode, education, experience, classesTaken: classesTakenNum, skills, languages, title, subjects: subjectIds, pricePerHour: pricePerHourNum, availableLocations },
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

export const addUpdateTutorAvatar = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if(!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const avatar = req.file?.path;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

        if(user?.avatar) {
            const deleteResponse = await deleteFromCloudinary(user.avatar);
            if(!deleteResponse) {
                return res.status(500).json(new ApiResponse(500, null, "Error deleting old avatar from cloudinary"));
            }
        }

        const cloudinaryResponse = await uploadOnCloudinary(avatar);
        if(!cloudinaryResponse) {
            return res.status(500).json(new ApiResponse(500, null, "Error uploading new avatar to cloudinary"));
        }

        user.avatar = cloudinaryResponse.url;
        await user.save();

        return res.status(200).json(new ApiResponse(200, cloudinaryResponse.url, "Tutor avatar updated successfully"));
    } catch (error) {
        console.error("Error updating tutor avatar:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});
