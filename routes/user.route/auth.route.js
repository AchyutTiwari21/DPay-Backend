import { Router } from "express";
import "../../utils/passport.js";
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
    googleCallback
} from "../../controllers/users/auth.controller/index.js";
import { verifyJWT, validateSchema } from "../../middlewares/index.js";
import { 
    signupSchema, 
    signinSchema, 
    otpSchema, 
    signoutSchema,
    checkOTPSchema, 
    changePasswordSchema,
    getUserDataSchema,
} from "../../zod/userSchema.js";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { frontendUrl } from "../../constants.js";

const registerLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 3 requests
  message: {
    status: 429,
    message: "Too many registration attempts. Please try again after 5 minutes."
  },
});

const router = Router();

router.route("/send-otp").post(validateSchema(otpSchema), sendOTP);

router.route("/signup").post(registerLimiter, validateSchema(signupSchema), registerUser);

router.route("/login").post(validateSchema(signinSchema), loginUser);

router.route("/logout").post(validateSchema(signoutSchema), verifyJWT, logoutUser);

router.route("/refresh-accessToken").post(refreshAccessToken);

router.route("/send-refresh-otp").post(validateSchema(otpSchema), sendRefreshOTP);

router.route("/check-otp").post(registerLimiter, validateSchema(checkOTPSchema), checkOTP);

router.route("/change-password").put(validateSchema(changePasswordSchema), verifyJWT, changePassword);

router.route("/me").get(validateSchema(getUserDataSchema), verifyJWT, getCurrentUser);

router.route("/google-oauth").get(passport.authenticate("google", { scope: ["email", "profile"] }));

router.get(
  "/googleCallback",
  passport.authenticate("google", { 
    failureRedirect: `${frontendUrl}`, 
    session: false 
  }),
  googleCallback
);

export default router;
