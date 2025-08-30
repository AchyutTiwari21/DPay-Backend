import { User } from "../../../models/index.js";
import { asyncHandler, ApiResponse } from "../../../utils/index.js";

export const changePassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200, null, "Password Changed successfuly."))
});