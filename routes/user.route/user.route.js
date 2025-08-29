import { Router } from "express";
import { 
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
} from "../../controllers/user.controller/index.js";
import { verifyJWT, validateSchema } from "../../middlewares/index.js";
import { 
    signupSchema, 
    signinSchema, 
    otpSchema, 
    signoutSchema, 
    refreshTokenSchema,
    checkOTPSchema, 
    changePasswordSchema,
    getUserDataSchema,
    applyTeachSchema
} from "../../zod/userSchema.js";

const router = Router();

router.route("/send-otp").post(validateSchema(otpSchema), sendOTP);

router.route("/signup").post(validateSchema(signupSchema), registerUser);

router.route("/login").post(validateSchema(signinSchema), loginUser);

router.route("/logout").post(validateSchema(signoutSchema), verifyJWT, logoutUser);

router.route("/refresh-accessToken").post(validateSchema(refreshTokenSchema), refreshAccessToken);

router.route("/send-refresh-otp").post(validateSchema(otpSchema), sendRefreshOTP);

router.route("/check-otp").post(validateSchema(checkOTPSchema), checkOTP);

router.route("/change-password").post(validateSchema(changePasswordSchema), verifyJWT, changePassword);

router.route("/me").get(validateSchema(getUserDataSchema), verifyJWT, getCurrentUser);

router.route("/apply-teach").post(validateSchema(applyTeachSchema), verifyJWT, applyTeach);

export default router;