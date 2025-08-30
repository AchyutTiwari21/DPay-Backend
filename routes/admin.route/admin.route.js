import { Router } from "express";
import { 
    getAllTeacherRequests, 
    updateTeacherRequest 
} from "../../controllers/admin.controller/index.js";
import { verifyAdminJWT, verifyAdmin } from "../../middlewares/index.js";

const router = Router();

router.get("/teacher-requests", verifyAdminJWT, verifyAdmin, getAllTeacherRequests);

router.put("/teacher-request/:id", verifyAdminJWT, verifyAdmin,  updateTeacherRequest);

export default router;
