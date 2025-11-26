import { Router } from "express";
import { z } from "zod";
import { 
    getStudentDashboardStats,
    fetchUpcomingDemoLesson,
    fetchStudentDetail
} from "../../controllers/student/index.js";
import { verifyJWT, validateSchema } from "../../middlewares/index.js";

const router = Router();

router.route("/dashboard-stats").get(validateSchema(z.void()), verifyJWT, getStudentDashboardStats);

router.route("/upcoming-demo-lessons").get(validateSchema(z.void()), verifyJWT, fetchUpcomingDemoLesson);

router.route("/student-detail").get(validateSchema(z.void()), verifyJWT, fetchStudentDetail);

export default router;
