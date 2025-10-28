import { z } from "zod";

const tutorSchema = z.object({
    about: z.string().min(10).max(100).nullish(),
    mode: z.enum(["online", "offline", "hybrid"]).nullish(),
    qualifications: z.array(z.string().min(1).max(50)).min(1).max(20).nullish(),
    experience: z.string().min(0).max(30).nullish(),
    lessonsCount: z.number().min(0).max(100000).nullish(),
    skills: z.array(z.string().min(1).max(50)).min(1).max(20).nullish(),
    languages: z.array(z.string().min(1).max(50)).min(1).max(5).nullish(),
    title: z.string().min(2).max(100).nullish(),
    subjects: z.array(z.string().min(2).max(50)).min(1).max(10).nullish(),
    pricePerHour: z.number().min(0).max(10000).nullish(),
}).strict();

// Regex for MongoDB ObjectId (24 hex characters)
const objectIdRegex = /^[a-f\d]{24}$/i;

const availabilitySchema = z.object({
  day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
  timeslots: z
    .array(
      z
        .string()
        .regex(
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          "Time must be in HH:MM 24-hour format"
        )
    )
    .min(1, "At least one timeslot is required"),
}).strict();

const tutorAvailabilitySchema = z.object({
  availabilities: z
    .array(availabilitySchema)
    .max(7, "Availability can have at most 7 days"),
  tutorId: z
    .string()
    .regex(objectIdRegex, "Invalid MongoDB ObjectId format"),
}).strict();

const getSubjectsQuerySchema = z.object({
  cursor: z.string().optional(),
  direction: z.enum(["forward", "backward"]).default("forward"),
  limit: z
    .string()
    .regex(/^\d+$/) // only digits allowed
    .transform(Number)
    .default("20")
    .refine(val => val > 0 && val <= 100, {
       message: "Limit must be between 1 and 100"
    }),
  search: z.string().optional()
});

export {
    tutorSchema,
    tutorAvailabilitySchema,
    getSubjectsQuerySchema
};
