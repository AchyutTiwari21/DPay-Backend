import { z } from "zod";

const otpSchema = z.object({
    email: z.string().min(5).max(50).email(),
}).strict();

const signupSchema = z.object({
    name: z.string().min(1).max(50).nullish(),
    email: z.string().min(5).max(50).email(),
    password: z.string().min(5).max(50),
    role: z.enum(["STUDENT", "TUTOR"]).nullish(),
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

const refreshTokenSchema = z.void();

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
    demoVideo: z.string().min(5).max(500),
    subjectsToTeach: z.array(z.string().min(2).max(100)).min(1).max(50),
    qualifications: z.array(z.string().min(2).max(100)).min(1).max(50),
    experience: z.string().min(1).max(500),
    resume: z.string().min(5).max(500)
}).strict();

const tutorQuerySchema = z.object({
  cursor: z.string().optional(),
  direction: z.enum(["forward", "backward"]).default("forward"),
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

export {
    signupSchema,
    signinSchema,
    otpSchema,
    changePasswordSchema,
    checkOTPSchema,
    refreshTokenSchema,
    signoutSchema,
    getUserDataSchema,
    applyTeachSchema,
    tutorQuerySchema
}