import { User, StudentProfile } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

export const getStudentProfile = asyncHandler(async (req, res) => {
    const user = req.user;
    try {
        const profile = await StudentProfile.findOne({ user: user._id }).populate("user", "name email phone avatar").select("address schoolBoard");

        if (!profile) {
            return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
        }
        return res.status(200).json(new ApiResponse(200, profile, "Student profile retrieved successfully"));
    } catch (error) {
        console.error("Error retrieving student profile:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});

export const updateStudentProfile = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { email, name, phone, address, schoolBoard } = req.body;

    if(!userId) {
        return res.status(402).json(
            new ApiResponse(402, null, "User ID is required.")
        );
    }

    const avatar = req.file?.path;

    // Validate input
    if (!email || !name || !phone || !address || !schoolBoard) {
        return res.status(400).json(
            new ApiResponse(400, null, "Please provide the required fields.")
        );
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(
                new ApiResponse(404, null, "User not found.")
            );
        }
        const profile = await StudentProfile.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json(
                new ApiResponse(404, null, "Student profile not found.")
            );
        }

        if (avatar) {
            if(user.avatar) {
                // If user already has a picture, delete the old one from cloudinary
                const deleteResponse = await deleteFromCloudinary(user.avatar);
                if(!deleteResponse) {
                    return res.status(500).json(
                        new ApiResponse(500, null, "Error while deleting the old avatar from cloudinary.")
                    );
                }
            }
    
            const cloudinaryResponse = await uploadOnCloudinary(avatar);
    
            if(!cloudinaryResponse) {
                return res.status(500).json(
                    new ApiResponse(500, null, "Error while uploading the new avatar to cloudinary.")
                );
            }

            user.avatar = cloudinaryResponse.url;
        }

        user.name = name;
        user.email = email;
        user.phone = phone;
        await user.save();

        profile.address = address;
        profile.schoolBoard = schoolBoard;
        profile.phone = phone;
        await profile.save();

        const updatedUser = await User.findById(userId).select("name email phone avatar");
        const updatedProfile = await StudentProfile.findOne({ user: userId }).select("address schoolBoard");

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    name: updatedUser?.name,
                    email: updatedUser?.email,
                    phone: updatedUser?.phone,
                    avatar: updatedUser?.avatar,
                    address: updatedProfile?.address,
                    schoolBoard: updatedProfile?.schoolBoard,
                },
                "Student profile updated successfully"
            )
        );
    } catch (error) {
        console.error("Error updating student profile:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});
