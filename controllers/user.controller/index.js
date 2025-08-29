import { sendOTP, sendRefreshOTP, checkOTP } from "./otp.controller.js";
import { registerUser } from "./registerUser.controller.js";
import { loginUser } from "./loginUser.controller.js";
import { logoutUser } from "./logoutUser.controller.js";
import { refreshAccessToken } from "./refreshAccessToken.controller.js";
import { changePassword } from "./changePassword.controller.js";
import { getCurrentUser } from "./getCurrentUser.controller.js";
import { applyTeach } from "./applyToTeach.controller.js";

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
    applyTeach
}