import { z } from "zod";

const tutorSchema = z.object({
    about: z.string().min(10).max(100),
    modeOfClass: z.enum(["online", "offline", "hybrid"]),
    experience: z.string().min(0).max(30),
    skills: z.array(z.string().min(1).max(50)).min(1).max(20),
    languages: z.array(z.string().min(1).max(50)).min(1).max(5),
    title: z.string().min(2).max(100),
    subjects: z.array(z.string().min(2).max(50)).min(1).max(10),
    hourlyRate: z.number().min(0).max(10000),
});
    
export {
    tutorSchema
};
