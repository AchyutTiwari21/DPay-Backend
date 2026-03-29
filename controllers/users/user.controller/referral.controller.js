import { Referral, Notification, Admin } from "../../../models/index.js";
import { ApiResponse, asyncHandler } from "../../../utils/index.js";

export const createReferral = asyncHandler(async (req, res) => {
    const { studentName, subjectToTeach, studentEmail, studentPhone, location } = req.body;
    const referrerId = req?.user?._id;

    await Referral.create({
        referrer: referrerId,
        studentName,
        subjectToTeach,
        studentEmail,
        studentPhone,
        location,
    }); 

    const admin = await Admin.findOne({ role: "superadmin" });

    const notification = await Notification.create({
        user: admin.user,
        title: "New Referral from " + req.user.name,
        message: `${req.user.name} referred a student (${studentName}) for ${subjectToTeach}. Check the Referral section.`,
        type: "referral",
    });

    admin.notifications.push(notification._id);
    await admin.save();

    res.status(201).json(new ApiResponse(201, null, "Referral Submitted Successfully!"));
});

export const getReferralsByUser = asyncHandler(async (req, res) => {
    const referrerId = req?.user?._id;
    const referrals = await Referral.find({ referrer: referrerId });
    res.status(200).json(new ApiResponse(200, referrals, "Referrals fetched successfully"));
});
