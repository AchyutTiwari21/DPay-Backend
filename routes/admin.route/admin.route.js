import { Router } from "express";
import { 
    getAllTeacherRequests, 
    updateTeacherRequest,
    addTutor,
    addSubject
} from "../../controllers/admin/index.js";
import { verifyJWT, verifyAdmin } from "../../middlewares/index.js";

const router = Router();

router.route("/teacher-requests").get(verifyJWT, verifyAdmin, getAllTeacherRequests);

router.route("/teacher-request/:id").put(verifyJWT, verifyAdmin,  updateTeacherRequest);

router.route("/add-tutor").post(verifyJWT, verifyAdmin, addTutor);

router.route("/add-subject").post(verifyJWT, verifyAdmin, addSubject);

export default router;
