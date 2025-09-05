import { asyncHandler, ApiResponse } from "../../../utils/index.js";

export const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfuly."));
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                null,
                'Internal Server Error'
            )
        );
    }
});