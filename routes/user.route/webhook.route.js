import { Router } from "express";
import { webhookHandler } from "../../controllers/users/webhook.controller/webhook.controller.js";

const router = Router();

router.post("/verifyPayment", webhookHandler);

export default router;
