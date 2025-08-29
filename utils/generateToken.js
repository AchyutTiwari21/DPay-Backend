import { User } from "../models/index.js";

export const generateAccessAndRefreshTokens = async function(userId) {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {accessToken, refreshToken};

    } catch (error) {
        throw error;
    }
}

export const generateAdminAccessAndRefreshTokens = async function(userId) {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAdminAccessToken();
        const refreshToken = user.generateAdminRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {accessToken, refreshToken};

    } catch (error) {
        throw error;
    }
}

export const generateTutorAccessAndRefreshTokens = async function(userId) {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateTutorAccessToken();
        const refreshToken = user.generateTutorRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {accessToken, refreshToken};

    } catch (error) {
        throw error;
    }
}