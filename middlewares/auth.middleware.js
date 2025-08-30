import { asyncHandler, ApiResponse } from "../utils/index.js";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.headers["authorization"]?.replace("Bearer ", "");
    
        if(!token) {
            return res.status(401).json(
              new ApiResponse(401, null, "Access token is required", "access_token_required")
            );
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user) {
            return res.status(401).json(
              new ApiResponse(401, null, "Invalid Access Token", "invalid_access_token")
            );
        }
    
        req.user = user;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
          // Access token expired
          return res.status(401).json(
            new ApiResponse(401, null, "Access token expired", "access_token_expired")
          );
        }
        return res.status(401).json(
          new ApiResponse(401, null, error?.message || "Invalid access token.", "invalid_access_token")
        );
    }
});

export const verifyAdmin = asyncHandler(async (req, res, next) => {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json(
            new ApiResponse(403, null, "Access denied", "admin_access_required")
        );
    }
    next();
});

export const verifyTutor = asyncHandler(async (req, res, next) => {
    if (req.user.role !== "TUTOR") {
        return res.status(403).json(
            new ApiResponse(403, null, "Access denied", "tutor_access_required")
        );
    }
    next();
});
