import { User } from "../../../models/index.js";
import { asyncHandler, ApiResponse } from "../../../utils/index.js";
import { cookieOptions } from "../../../constants.js";
import { generateAccessAndRefreshTokens } from "../../../utils/index.js";

export const loginUser = asyncHandler( (async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie
    const {email, password} = req.body;

    try {
        const user = await User.findOne({
            email
        });
    
        if(!user) {
            return res.status(401).json(
                new ApiResponse(
                    401,
                    null,
                    "Email is incorrect or user is not registered."
                )
            );
        }
    
        const isPasswordValid = await user.isPasswordCorrect(password);

        if(!isPasswordValid) {
            return res.status(401).json(
                new ApiResponse(
                    401,
                    null,
                    "Email or Password is incorrect"
                )
            );
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, { 
            ...cookieOptions, 
            maxAge: 15 * 60 * 1000 // 15 minutes
        })
        .cookie("refreshToken", refreshToken, { 
            ...cookieOptions, 
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfuly"
            )
        );
    } catch (error) {
        console.error("Error logging in user:", error.message);
        return res.status(500).json(
            new ApiResponse(
                500,
                null,
                "Internal Server Error"
            )
        );
    }
}));

export const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from documnent
            }
        },
        {
            new: true
        }
    );

    return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "User logged Out"));
});