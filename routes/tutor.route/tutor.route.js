import { Router } from "express";
import { z } from "zod";
import { 
    updateTutorProfile,
    getTutorProfile,
    addAvailability,
    updateAvailability,
    deleteAvailability,
    getDashboardStats
} from "../../controllers/tutor/index.js";
import {
    tutorSchema,
    addAvailabilitySchema,
    updateAvailabilitySchema,
    deleteAvailabilitySchema,
} from "../../zod/tutorSchema.js";
import { verifyJWT, verifyTutor, validateSchema, validateQuery } from "../../middlewares/index.js";

const router = Router();

router.route("/update-profile").put(verifyJWT, verifyTutor, validateSchema(tutorSchema), updateTutorProfile);

router.route("/profile").get(verifyJWT, verifyTutor, validateSchema(z.void()), getTutorProfile);

router.route("/add-availability").post(verifyJWT, verifyTutor, validateSchema(addAvailabilitySchema), addAvailability);

router.route("/update-availability").put(verifyJWT, verifyTutor, validateSchema(updateAvailabilitySchema), updateAvailability);

router.route("/delete-availability").delete(verifyJWT, verifyTutor, validateSchema(deleteAvailabilitySchema), deleteAvailability);

router.route("/dashboard-stats").get(verifyJWT, verifyTutor, validateSchema(z.void()), getDashboardStats);

export default router;
