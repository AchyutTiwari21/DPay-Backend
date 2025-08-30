import { Router } from "express";
import {
    applyTeach
} from "../../controllers/users/user.controller/index.js";
import { 
    applyTeachSchema 
} from "../../zod/userSchema.js";
import { verifyJWT, validateSchema } from "../../middlewares/index.js";

const router = Router();

router.route("/apply-teach").post(validateSchema(applyTeachSchema), verifyJWT, applyTeach);

export default router;