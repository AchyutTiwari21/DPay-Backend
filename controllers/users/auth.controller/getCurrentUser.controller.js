import { asyncHandler, ApiResponse } from "../../../utils/index.js";

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfuly."));
});