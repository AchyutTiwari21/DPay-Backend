import { applyTeach } from "./applyToTeach.controller.js";
import { getTutors, getTutorById } from "./fetchTutors.controller.js";
import { createOrder, verifyOrder } from "./payment.controller.js";
import { getSubjects } from "./getSubjects.controller.js";
import { createReferral, getReferralsByUser } from "./referral.controller.js";

export {
    applyTeach,
    getTutors,
    getTutorById,
    createOrder,
    verifyOrder,
    getSubjects,
    createReferral,
    getReferralsByUser
}