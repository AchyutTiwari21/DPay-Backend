import { Router } from "express";
import { z } from "zod";
import { 
    getStudentDashboardStats,
    fetchUpcomingDemoLesson,
    fetchStudentDetail,
    acceptRejectClassRequest,
    markNotificationsAsRead,
    removeNotification,
    buySubscription,
    verifySubscriptionPayment,
    getStudentProfile,
    updateStudentProfile,
    getStudentTution,
    getStudentTutor
} from "../../controllers/student/index.js";
import { 
    acceptRejectClassRequestSchema,
    markNotificationsAsReadSchema,
    verifyPaymentSchema,
    profileUpdateSchema
} from "../../zod/student.schema.js";
import { verifyJWT, validateSchema, upload } from "../../middlewares/index.js";

const router = Router();

router.route("/dashboard-stats").get(validateSchema(z.void()), verifyJWT, getStudentDashboardStats);

router.route("/upcoming-demo-lessons").get(validateSchema(z.void()), verifyJWT, fetchUpcomingDemoLesson);

router.route("/student-detail").get(validateSchema(z.void()), verifyJWT, fetchStudentDetail);

router.route("/accept-reject-class-request").post(
    validateSchema(acceptRejectClassRequestSchema), 
    verifyJWT, 
    acceptRejectClassRequest
);

router.route("/mark-notifications-as-read").put(
    validateSchema(markNotificationsAsReadSchema), 
    verifyJWT, 
    markNotificationsAsRead
);

router.route("/remove-notification/:notificationId").delete(verifyJWT, removeNotification);

router.route("/buy-subscription").post(validateSchema(z.void()), verifyJWT, buySubscription);

router.route("/verify-subscription-payment").post(validateSchema(verifyPaymentSchema), verifyJWT, verifySubscriptionPayment);

router.route("/profile").get(validateSchema(z.void()), verifyJWT, getStudentProfile);

router.route("/update-student-profile").put(upload.single("avatar"), validateSchema(profileUpdateSchema), verifyJWT, updateStudentProfile);

router.route("/tutions").get(validateSchema(z.void()), verifyJWT, getStudentTution);

router.route("/tutors").get(validateSchema(z.void()), verifyJWT, getStudentTutor);

export default router;
