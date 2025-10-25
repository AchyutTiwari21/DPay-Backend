import { User } from "../../models/index.js";
import { asyncHandler, ApiResponse } from "../../utils/index.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

export const updateAdminCredentials = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { email, name, oldPassword, newPassword } = req.body;

    if(!userId) {
        return res.status(402).json(
            new ApiResponse(402, null, "User ID is required.")
        );
    }

    const avatar = req.file?.path;

    // Validate input
    if (!email || !name) {
        return res.status(400).json(
            new ApiResponse(400, null, "Please provide the required fields.")
        );
    }

    try {
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(
                new ApiResponse(404, null, "User not found.")
            );
        }
    
        // Check old password
        if(oldPassword && newPassword) {
            const isMatch = await user.isPasswordCorrect(oldPassword);
            if (!isMatch) {
                return res.status(400).json(
                    new ApiResponse(400, null, "Old password is incorrect.")
                );
            }
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
    
        // Update user
        user.email = email;
        user.name = name;
        if (oldPassword && newPassword) {
            user.password = newPassword;
        }
        await user.save();
    
        return res.status(200).json(
            new ApiResponse(200, user, "Admin credentials updated successfully.")
        );
    } catch (error) {
        console.log("Error while updating admin credentials: ", error.message);     
        return res.status(500).json(
            new ApiResponse(500, null, "Internal server error.", error.message)
        );
    }
})
