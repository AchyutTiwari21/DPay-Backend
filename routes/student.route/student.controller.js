import { Router } from "express";
import { z } from "zod";
import { 
    getStudentDashboardStats,
    fetchUpcomingDemoLesson
} from "../../controllers/student/index.js";
import { verifyJWT, validateSchema } from "../../middlewares/index.js";

const router = Router();

router.route("/dashboard-stats").get(validateSchema(z.void()), verifyJWT, getStudentDashboardStats);

router.route("/upcoming-demo-lessons").get(validateSchema(z.void()), verifyJWT, fetchUpcomingDemoLesson);

export default router;
