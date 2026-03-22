import { Router } from "express";
import { z } from "zod";
import {
    applyTeach,
    getTutors,
    getTutorById,
    createOrder,
    verifyOrder,
    getSubjects,
    createReferral,
    getReferralsByUser
} from "../../controllers/users/user.controller/index.js";
import { 
    applyTeachSchema,
    tutorQuerySchema,
    subjectQuerySchema,
    createOrderSchema,
    verifyOrderSchema,
    referralSchema
} from "../../zod/userSchema.js";
import { verifyJWT, validateSchema, validateQuery } from "../../middlewares/index.js";

const router = Router();

router.route("/apply-teach").post(validateSchema(applyTeachSchema), verifyJWT, applyTeach);

router.route("/get-subjects").get(validateSchema(z.void()), validateQuery(subjectQuerySchema), getSubjects);

router.route("/get-tutors").get(validateSchema(z.void()), validateQuery(tutorQuerySchema), getTutors);

router.route("/get-tutor/:id").get(validateSchema(z.void()), getTutorById);

router.route("/create-order").post(validateSchema(createOrderSchema), verifyJWT, createOrder);

router.route("/verify-payment").post(validateSchema(verifyOrderSchema), verifyJWT, verifyOrder);

router.route("/create-referral").post(validateSchema(referralSchema), verifyJWT, createReferral);

router.route("/get-referrals").get(validateSchema(z.void()), verifyJWT, getReferralsByUser);

export default router;