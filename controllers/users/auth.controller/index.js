import { sendOTP, sendRefreshOTP, checkOTP } from "./otp.controller.js";
import { registerUser } from "./registerUser.controller.js";
import { loginUser, logoutUser } from "./loginUser.controller.js";
import { refreshAccessToken } from "./refreshAccessToken.controller.js";
import { changePassword } from "./changePassword.controller.js";
import { getCurrentUser } from "./getCurrentUser.controller.js";

export {
    sendOTP,
    sendRefreshOTP,
    checkOTP,
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
}