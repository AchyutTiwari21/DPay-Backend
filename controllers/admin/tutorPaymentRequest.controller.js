import { TutorPaymentRequest, TutorProfile } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";
import { mailSender } from "../../utils/mailSender.js";

export const createPaymentRequest = asyncHandler(async (req, res) => {
    try {
        const { tutorId, amount } = req.body;

        const tutor = await TutorProfile.findById(tutorId).populate("user", "email name");

        if(!tutor) {
            return res.status(404).json(
                new ApiResponse(404, null, "Tutor not found")
            );
        }

        const paymentRequest = new TutorPaymentRequest({
            tutor: tutorId,
            amount
        });

        await paymentRequest.save();

        await mailSender(tutor.user.email, "New Payment Request", `
            <p>Dear ${tutor.user.name},</p>
            <p>You have a new payment request of $${amount}.</p>
            <p>Please log in to your account to view and process the payment request.</p>
            <p>Best regards,<br/>DPay Team</p>
        `);

        return res.status(201).json(
            new ApiResponse(
                201,
                null,
                "Payment request sent successfully!",
            )
        );
    } catch (error) {
        console.error("Error creating payment request:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
