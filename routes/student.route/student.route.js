import { Router } from "express";
import { z } from "zod";
import { 
    getStudentDashboardStats,
    fetchUpcomingDemoLesson,
    fetchStudentDetail,
    acceptRejectClassRequest,
    markNotificationsAsRead,
    removeNotification,
    buySubscription
} from "../../controllers/student/index.js";
import { 
    acceptRejectClassRequestSchema,
    markNotificationsAsReadSchema
} from "../../zod/student.schema.js";
import { verifyJWT, validateSchema } from "../../middlewares/index.js";

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

export default router;
