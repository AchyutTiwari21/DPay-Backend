export const DB_NAME = "dpay";

export const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: true
};

export let sessionAmount = 2000;

export const googleOAuthRedirectUrl = "http://localhost:8000/api/auth/googleCallback";

export const frontendUrl = "http://localhost:5173";