import { User } from "../../../models/index.js";
import { asyncHandler, ApiResponse } from "../../../utils/index.js";
import jwt from "jsonwebtoken";
import { cookieOptions } from "../../../constants.js";

import { generateAccessAndRefreshTokens } from "../../../utils/index.js";

export const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken;

    if(!incomingRefreshToken) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized request"));
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        );
    
        const user = await User.findById(decodedToken?._id)
        
        if(!user) {
            return res.status(401).json(new ApiResponse(401, null, "Invalid refresh token"));
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            return res.status(401).json(new ApiResponse(401, null, "Refresh token is expired or used"));
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken},
                "Access token refreshed successfuly"
            )
        )
    } catch (error) {
        return res.status(401).json(new ApiResponse(401, null, error?.message || "Invalid refresh token."));
    }
});