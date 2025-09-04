import { asyncHandler, generateAccessAndRefreshTokens } from "../../../utils/index.js";
import { cookieOptions, frontendUrl } from "../../../constants.js";

export const googleCallback  = asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(req.user.id);

    // Set the tokens in cookies
    res.cookie("accessToken", accessToken, { 
      ...cookieOptions, 
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
      res.cookie("refreshToken", refreshToken, { 
      ...cookieOptions, 
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Redirect to the frontend
    return res.redirect(`${frontendUrl}`);
});
