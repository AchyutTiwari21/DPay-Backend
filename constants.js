export const DB_NAME = "dpay";

export const cookieOptions = {
    httpOnly: true,
    sameSite: 'none',
    secure: true
};

export const sessionAmount = 2000;

export const tutorPayoutAmount = 5000;

export const googleOAuthRedirectUrl = `${process.env.BACKEND_URL}/api/auth/googleCallback`;

export const frontendUrl = process.env.CORS_ORIGIN;
