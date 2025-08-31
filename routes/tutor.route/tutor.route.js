import { Router } from "express";
import { 
    updateTutorProfile,
    getTutorProfile,
    getSubjects
} from "../../controllers/tutor/index.js";
import { verifyJWT, verifyTutor } from "../../middlewares/index.js";

const router = Router();

router.route("/update-profile").put(verifyJWT, verifyTutor, updateTutorProfile);

router.route("/profile").get(verifyJWT, verifyTutor, getTutorProfile);

router.route("/subjects").get(verifyJWT, verifyTutor, getSubjects);

export default router;
