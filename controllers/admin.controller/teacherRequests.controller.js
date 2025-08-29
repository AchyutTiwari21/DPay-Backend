import { ApplyTeacherRequest } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";

export const getAllTeacherRequests = asyncHandler(async (req, res) => {
    try {
        const requests = await ApplyTeacherRequest.find().populate("userId", "name email profileImg");
        res.status(200).json(
            new ApiResponse(true, requests, "Teacher requests fetched successfully")
        );
    } catch (error) {
        res.status(500).json(new ApiResponse(false, null, "Error fetching teacher requests", error.message));
    }
});
