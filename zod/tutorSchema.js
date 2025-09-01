import { z } from "zod";

const tutorSchema = z.object({
    about: z.string().min(10).max(100).nullish(),
    mode: z.enum(["online", "offline", "hybrid"]).nullish(),
    qualifications: z.array(z.string().min(1).max(50)).min(1).max(20).nullish(),
    experience: z.string().min(0).max(30).nullish(),
    lessonsCount: z.string().min(0).max(20).nullish(),
    skills: z.array(z.string().min(1).max(50)).min(1).max(20).nullish(),
    languages: z.array(z.string().min(1).max(50)).min(1).max(5).nullish(),
    title: z.string().min(2).max(100).nullish(),
    subjects: z.array(z.string().min(2).max(50)).min(1).max(10).nullish(),
    pricePerHour: z.string().min(0).max(100).nullish(),
}).strict();

const addAvailabilitySchema = z.object({
    day: z.string().min(3).max(20),
    timeslots: z.array(z.string().min(5).max(5)).min(1).max(10)
});

const updateAvailabilitySchema = z.object({
    availabilityId: z.string().min(24).max(24),
    day: z.string().min(3).max(20).nullish(),
    timeslots: z.array(z.string().min(5).max(20)).min(1).max(10).nullish()
});

const deleteAvailabilitySchema = z.object({
    availabilityId: z.string().min(24).max(24)
});

export {
    tutorSchema,
    addAvailabilitySchema,
    updateAvailabilitySchema,
    deleteAvailabilitySchema
};
