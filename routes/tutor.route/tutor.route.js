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
    sendClassRequestNotification
} from "../../controllers/tutor/index.js";
import {
    tutorSchema,
    tutorAvailabilitySchema,
    sendClassRequestNotificationSchema
} from "../../zod/tutorSchema.js";
import { verifyJWT, verifyTutor, validateSchema, validateQuery } from "../../middlewares/index.js";

const router = Router();

router.route("/update-profile").put(verifyJWT, verifyTutor, validateSchema(tutorSchema), updateTutorProfile);

router.route("/profile").get(verifyJWT, verifyTutor, validateSchema(z.void()), getTutorProfile);

router.route("/add-availability").post(verifyJWT, verifyTutor, validateSchema(tutorAvailabilitySchema), addAvailability);

router.route("/dashboard-stats").get(verifyJWT, verifyTutor, validateSchema(z.void()), getDashboardStats);

router.route("/demo-sessions").get(verifyJWT, verifyTutor, validateSchema(z.void()), getDemoSessions);

router.route("/booking-trends").get(verifyJWT, verifyTutor, validateSchema(z.void()), getBookingTrends);

router.route("/demo-stats").get(verifyJWT, verifyTutor, validateSchema(z.void()), getDemoStats);

router.route("/tutor-detail").get(verifyJWT, verifyTutor, validateSchema(z.void()), getTutor);

router.route("/demo-sessions-handler").get(verifyJWT, verifyTutor, validateSchema(z.void()), getDemoSessionsHandler);

router.route("/send-class-request-notification").post(verifyJWT, verifyTutor, validateSchema(sendClassRequestNotificationSchema), sendClassRequestNotification);

export default router;
