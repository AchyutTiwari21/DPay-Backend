import { Router } from "express";
import { z } from "zod";
import { getStudentDashboardStats } from "../../controllers/student/index.js";
import { verifyJWT, validateSchema } from "../../middlewares/index.js";

const router = Router();

router.route("/dashboard-stats").get(validateSchema(z.void()), verifyJWT, getStudentDashboardStats);
export default router;
