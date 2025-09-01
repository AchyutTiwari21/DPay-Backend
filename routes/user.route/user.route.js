import { Router } from "express";
import { z } from "zod";
import {
    applyTeach,
    getTutors
} from "../../controllers/users/user.controller/index.js";
import { 
    applyTeachSchema,
    tutorQuerySchema
} from "../../zod/userSchema.js";
import { verifyJWT, validateSchema, validateQuery } from "../../middlewares/index.js";

const router = Router();

router.route("/apply-teach").post(validateSchema(applyTeachSchema), verifyJWT, applyTeach);

router.route("/get-tutors").get(validateSchema(z.void()), validateQuery(tutorQuerySchema), getTutors);

export default router;