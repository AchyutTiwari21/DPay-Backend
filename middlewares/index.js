import { verifyJWT, verifyAdmin, verifyTutor } from "./auth.middleware.js";
import { upload } from "./multer.middleware.js";
import { validateSchema, validateQuery } from "./validate.middleware.js";


export {
    verifyJWT,
    upload,
    validateSchema,
    validateQuery,
    verifyAdmin,
    verifyTutor
}