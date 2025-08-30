import { ApplyTeacherRequest } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";

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

        return res.status(200).json(
            new ApiResponse(true, updatedRequest, "Teacher request updated successfully")
        );
    } catch (error) {
        return res.status(500).json(new ApiResponse(false, null, "Error updating teacher request", error.message));
    }
});
