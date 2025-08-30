import { Router } from "express";
import { 
    updateTutorProfile
} from "../../controllers/tutor/index.js";
import { verifyJWT, verifyTutor } from "../../middlewares/index.js";

const router = Router();

router.route("/update-profile").put(verifyJWT, verifyTutor, updateTutorProfile);

export default router;
