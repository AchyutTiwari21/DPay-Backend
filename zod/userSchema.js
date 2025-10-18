import { z } from "zod";

const otpSchema = z.object({
    email: z.string().min(5).max(50).email(),
}).strict();

const signupSchema = z.object({
    name: z.string().min(1).max(50).nullish(),
    email: z.string().min(5).max(50).email(),
    password: z.string().min(5).max(50),
    otp: z.string().min(6).max(6)
}).superRefine(({password}, checkPassComplexity) => {
    const containsUpperCase = (ch) => /[A-Z]/.test(ch);
    const containsLowerCase = (ch) => /[a-z]/.test(ch);
    const containsSpecialChar = (ch) => /[`!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?~ ]/.test(ch);

    let countOfUpperCase = 0, countOfLowerCase = 0, countOfSpecialChar = 0, countOfNumber = 0;

    for(let i = 0; i < password.length; i++) {
        let ch = password.charAt(i);
        if(!isNaN(+ch)) countOfNumber++;
        if(containsLowerCase(ch)) countOfLowerCase++;
        if(containsUpperCase(ch)) countOfUpperCase++;
        if(containsSpecialChar(ch)) countOfSpecialChar++;
    }

    let errObj = {
        upperCase: {pass: true, message:"Add upper case."},
        lowerCase: {pass: true, message:"Add lower case."},
        specialChar: {pass: true, message: "Add special character."},
        totalNumber: {pass: true, message: "Add number."}
    };

    if(countOfLowerCase < 1) {
        errObj = {...errObj, lowerCase: {...errObj.lowerCase, pass: false}};
    }
    if(countOfUpperCase < 1) {
        errObj = {...errObj, upperCase: {...errObj.upperCase, pass: false}};
    }
    if(countOfSpecialChar < 1) {
        errObj = {...errObj, specialChar: {...errObj.specialChar, pass: false}};
    }
    if(countOfNumber < 1) {
        errObj = {...errObj, totalNumber: {...errObj.totalNumber, pass: false}};
    }

    if(countOfLowerCase < 1 || countOfUpperCase < 1 || countOfSpecialChar < 1 || countOfNumber < 1) {
        checkPassComplexity.addIssue({
            code: "custom",
            path: ["password"],
            message: JSON.stringify(errObj)
        });
    }
}).strict();

const signinSchema = z.object({
    email: z.string().min(5).max(50).email(),
    password: z.string().min(5).max(50)
}).strict();

const signoutSchema = z.void();

const checkOTPSchema = z.object({
    email: z.string().min(5).max(50).email(),
    otp: z.string().min(6).max(6)
}).strict();

const changePasswordSchema = z.object({
    newPassword: z.string().min(5).max(50)
}).superRefine(({newPassword}, checkPassComplexity) => {
    const containsUpperCase = (ch) => /[A-Z]/.test(ch);
    const containsLowerCase = (ch) => /[a-z]/.test(ch);
    const containsSpecialChar = (ch) => /[`!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?~ ]/.test(ch);

    let countOfUpperCase = 0, countOfLowerCase = 0, countOfSpecialChar = 0, countOfNumber = 0;

    for(let i = 0; i < newPassword.length; i++) {
        let ch = newPassword.charAt(i);
        if(!isNaN(+ch)) countOfNumber++;
        if(containsLowerCase(ch)) countOfLowerCase++;
        if(containsUpperCase(ch)) countOfUpperCase++;
        if(containsSpecialChar(ch)) countOfSpecialChar++;
    }

    let errObj = {
        upperCase: {pass: true, message:"Add upper case."},
        lowerCase: {pass: true, message:"Add lower case."},
        specialChar: {pass: true, message: "Add special character."},
        totalNumber: {pass: true, message: "Add number."}
    };

    if(countOfLowerCase < 1) {
        errObj = {...errObj, lowerCase: {...errObj.lowerCase, pass: false}};
    }
    if(countOfUpperCase < 1) {
        errObj = {...errObj, upperCase: {...errObj.upperCase, pass: false}};
    }
    if(countOfSpecialChar < 1) {
        errObj = {...errObj, specialChar: {...errObj.specialChar, pass: false}};
    }
    if(countOfNumber < 1) {
        errObj = {...errObj, totalNumber: {...errObj.totalNumber, pass: false}};
    }

    if(countOfLowerCase < 1 || countOfUpperCase < 1 || countOfSpecialChar < 1 || countOfNumber < 1) {
        checkPassComplexity.addIssue({
            code: "custom",
            path: ["password"],
            message: errObj.toString()
        });
    }
}).strict();

const getUserDataSchema = z.void();

const applyTeachSchema = z.object({
    address: z.string().min(5).max(200),
    phone: z.string().min(7).max(15),
    demoVideo: z.string().min(5).max(500).nullish(),
    subjects: z.array(z.string().min(2).max(100)).min(1).max(50),
    qualifications: z.array(z.string().min(2).max(100)).min(1).max(50),
    experience: z.string().min(1).max(500),
    resume: z.string().min(5).max(500)
}).strict();

const tutorQuerySchema = z.object({
  page: z
     .string()
     .min("1")
     .max("4")
     .transform(Number)
     .default("1"),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default("7") // match your default
    .refine(val => val > 0 && val <= 20, {
      message: "Limit must be between 1 and 20",
    }),
  search: z.string().optional(),
  language: z.string().optional(),
  minPrice: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default("0"),
  maxPrice: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default("9999"),
});

const subjectQuerySchema = z.object({
  cursor: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId")
    .optional(),
  direction: z.enum(["forward", "backward"]).default("forward"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "limit must be a positive number",
    })
    .refine(val => val > 0 && val <= 40, {
       message: "Limit must be between 1 and 100"
    })
    .default("20")
    .transform((val) => Number(val)),
  search: z.string().min(0).max(50).optional(),
});

const createOrderSchema = z.object({
    tutorId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId"),
    date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Date must be in YYYY-MM-DD format"),
    time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format (24h)"),
    subject: z.string().min(1).max(100),
}).strict();

const verifyOrderSchema = z.object({
  razorpay_order_id: z
    .string()
    .min(10, "Order ID is required")
    .max(40, "Order ID too long")
    .regex(/^order_/, "Invalid order ID format"),

  razorpay_payment_id: z
    .string()
    .min(10, "Payment ID is required")
    .max(40, "Payment ID too long")
    .regex(/^pay_/, "Invalid payment ID format"),

  razorpay_signature: z
    .string()
    .length(64, "Signature must be a 64-character hex string")
    .regex(/^[a-f0-9]+$/, "Invalid signature format"),
});

export {
    signupSchema,
    signinSchema,
    otpSchema,
    changePasswordSchema,
    checkOTPSchema,
    signoutSchema,
    getUserDataSchema,
    applyTeachSchema,
    tutorQuerySchema,
    subjectQuerySchema,
    createOrderSchema,
    verifyOrderSchema
}