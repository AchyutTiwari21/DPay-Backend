import { Router } from "express";
import { z } from "zod";
import { 
    updateTutorProfile,
    getTutorProfile,
    addAvailability,
    getDashboardStats,
    getDemoSessions,
    getBookingTrends,
    getDemoStats,
    getTutor,
    getDemoSessionsHandler,
    sendClassRequestNotification,
    addMeetingLinkHandler,
    markSessionComplete,
    addUpdateTutorAvatar,
    markNotificationsAsRead,
    removeNotification,
    initiateTutorPayout,
    verifyTutorPayout,
    addTutorLocation,
    buySubscription,
    verifySubscriptionPayment,
    getTutorStudents,
    getTuitions,
    addTuitionData
} from "../../controllers/tutor/index.js";
import {
    tutorSchema,
    tutorAvailabilitySchema,
    sendClassRequestNotificationSchema,
    markNotificationsAsReadSchema,
    verifyTutorPayoutSchema,
    addMeetingLinkHandlerSchema,
    tutorLocationSchema,
    verifyPaymentSchema,
    tuitionSchema
} from "../../zod/tutorSchema.js";
import { verifyJWT, verifyTutor, validateSchema, upload } from "../../middlewares/index.js";

const router = Router();

router.route("/update-profile").put(verifyJWT, verifyTutor, validateSchema(tutorSchema), updateTutorProfile);

router.route("/add-location").put(verifyJWT, verifyTutor, validateSchema(tutorLocationSchema), addTutorLocation);

router.route("/profile").get(verifyJWT, verifyTutor, validateSchema(z.void()), getTutorProfile);

router.route("/add-update-avatar").put(verifyJWT, verifyTutor, validateSchema(z.void()), upload.single("avatar"), addUpdateTutorAvatar);

router.route("/add-availability").post(verifyJWT, verifyTutor, validateSchema(tutorAvailabilitySchema), addAvailability);

router.route("/dashboard-stats").get(verifyJWT, verifyTutor, validateSchema(z.void()), getDashboardStats);

router.route("/demo-sessions").get(verifyJWT, verifyTutor, validateSchema(z.void()), getDemoSessions);

router.route("/booking-trends").get(verifyJWT, verifyTutor, validateSchema(z.void()), getBookingTrends);

router.route("/demo-stats").get(verifyJWT, verifyTutor, validateSchema(z.void()), getDemoStats);

router.route("/tutor-detail").get(verifyJWT, verifyTutor, validateSchema(z.void()), getTutor);

router.route("/demo-sessions-handler").get(verifyJWT, verifyTutor, validateSchema(z.void()), getDemoSessionsHandler);

router.route("/send-class-request-notification").post(verifyJWT, verifyTutor, validateSchema(sendClassRequestNotificationSchema), sendClassRequestNotification);

router.route("/mark-notifications-as-read").put(verifyJWT, verifyTutor, validateSchema(markNotificationsAsReadSchema), markNotificationsAsRead);

router.route("/remove-notification/:notificationId").delete(verifyJWT, verifyTutor, removeNotification);

router.route("/pay-tutor-payout").post(verifyJWT, verifyTutor, validateSchema(z.void()), initiateTutorPayout);

router.route("/verify-tutor-payout").post(verifyJWT, verifyTutor, validateSchema(verifyTutorPayoutSchema), verifyTutorPayout);

router.route("/add-meeting-link").put(verifyJWT, verifyTutor, validateSchema(addMeetingLinkHandlerSchema), addMeetingLinkHandler);

router.route("/mark-session-complete/:lessonId").put(verifyJWT, verifyTutor, validateSchema(z.void()), markSessionComplete);

router.route("/buy-subscription").post(verifyJWT, verifyTutor, validateSchema(z.void()), buySubscription);

router.route("/verify-subscription-payment").post(verifyJWT, verifyTutor, validateSchema(verifyPaymentSchema), verifySubscriptionPayment);

router.route("/students").get(verifyJWT, verifyTutor, validateSchema(z.void()), getTutorStudents);

router.route("/tuitions").get(verifyJWT, verifyTutor, validateSchema(z.void()), getTuitions);

router.route("/add-tuitions-data").post(verifyJWT, verifyTutor, validateSchema(tuitionSchema), addTuitionData);

export default router;
