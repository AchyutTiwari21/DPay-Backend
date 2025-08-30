import { Router } from "express";
import { 
    getAllTeacherRequests, 
    updateTeacherRequest 
} from "../../controllers/admin/index.js";
import { verifyJWT, verifyAdmin } from "../../middlewares/index.js";

const router = Router();

router.get("/teacher-requests", verifyJWT, verifyAdmin, getAllTeacherRequests);

router.put("/teacher-request/:id", verifyJWT, verifyAdmin,  updateTeacherRequest);

export default router;
