import { Referral, TutorProfile } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";

export const createReferral = asyncHandler(async (req, res) => {
    const { studentName, subjectToTeach, studentEmail, studentPhone, location } = req.body;
    const referrerId = req?.user?._id;

    const tutorProfile = await TutorProfile.findOne({ user: referrerId });
    if (!tutorProfile) {
        return res.status(404).json(new ApiResponse(404, null, "Tutor profile not found"));
    }

    await Referral.create({
        referrer: referrerId,
        studentName,
        subjectToTeach,
        studentEmail,
        studentPhone,
        location,
    });
    res.status(201).json(new ApiResponse(201, null, "Referral created successfully"));
});

export const getReferralsByTutor = asyncHandler(async (req, res) => {
    const referrerId = req?.user?._id;
    const referrals = await Referral.find({ referrer: referrerId });
    res.status(200).json(new ApiResponse(200, referrals, "Referrals fetched successfully"));
});
