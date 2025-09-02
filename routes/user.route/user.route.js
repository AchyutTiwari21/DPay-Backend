import { Router } from "express";
import { z } from "zod";
import {
    applyTeach,
    getTutors,
    createOrder,
    markPaymentFailed
} from "../../controllers/users/user.controller/index.js";
import { 
    applyTeachSchema,
    tutorQuerySchema,
    createOrderSchema,
    paymentFailSchema
} from "../../zod/userSchema.js";
import { verifyJWT, validateSchema, validateQuery } from "../../middlewares/index.js";

const router = Router();

router.route("/apply-teach").post(validateSchema(applyTeachSchema), verifyJWT, applyTeach);

router.route("/get-tutors").get(validateSchema(z.void()), validateQuery(tutorQuerySchema), getTutors);

router.route("/create-order").post(validateSchema(createOrderSchema), verifyJWT, createOrder);

router.route("/payment/failed").post(validateSchema(paymentFailSchema), verifyJWT, markPaymentFailed);

export default router;