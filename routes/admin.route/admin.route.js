import { Router } from "express";
import { 
    getAllTeacherRequests, 
    updateTeacherRequest,
    addTutor,
    getTutors,
    getTutor,
    removeTutor,
    addSubject,
    removeSubject
} from "../../controllers/admin/index.js";
import { verifyJWT, verifyAdmin } from "../../middlewares/index.js";

const router = Router();

router.route("/teacher-requests").get(verifyJWT, verifyAdmin, getAllTeacherRequests);

router.route("/teacher-request/:id").put(verifyJWT, verifyAdmin,  updateTeacherRequest);

router.route("/add-tutor").post(verifyJWT, verifyAdmin, addTutor);

router.route("/get-tutors").get(verifyJWT, verifyAdmin, getTutors);

router.route("/get-tutor/:userId").get(verifyJWT, verifyAdmin, getTutor);

router.route("/remove-tutor/:userId").delete(verifyJWT, verifyAdmin, removeTutor);

router.route("/add-subject").post(verifyJWT, verifyAdmin, addSubject);

router.route("/remove-subject/:subjectId").delete(verifyJWT, verifyAdmin, removeSubject);   

export default router;
