import { z } from "zod";

const tutorSchema = z.object({
    phone: z.string().min(10).max(15).nullish(),
    address: z.string().min(1).max(100).nullish(),
    about: z.string().min(1).max(1000).nullish(),
    mode: z.enum(["online", "offline", "hybrid"]).nullish(),
    education: z.array(z.string().min(1).max(200)).min(1).max(20).nullish(),
    experience: z.string().min(0).max(30).nullish(),
    classesTaken: z.string().min(1).max(100).nullish(),
    skills: z.array(z.string().min(1).max(50)).min(1).max(20).nullish(),
    languages: z.array(z.string().min(1).max(50)).min(1).max(5).nullish(),
    title: z.string().min(1).max(100).nullish(),
    subjects: z.array(z.string().min(1).max(50)).min(1).max(10).nullish(),
    pricePerHour: z.string().min(1).max(100).nullish(),
    availableLocations: z.array(z.string().min(1).max(100)).min(1).max(10).nullish(),
}).strict();

const tutorLocationSchema = z.object({
    address: z
        .string()
        .min(1, "Address is required")
        .max(200, "Address must be under 200 characters"),

    latitude: z
        .number({
            required_error: "Latitude is required",
            invalid_type_error: "Latitude must be a number",
        })
        .min(-90, "Latitude must be >= -90")
        .max(90, "Latitude must be <= 90"),

    longitude: z
        .number({
            required_error: "Longitude is required",
            invalid_type_error: "Longitude must be a number",
        })
        .min(-180, "Longitude must be >= -180")
        .max(180, "Longitude must be <= 180"),

    city: z.string().min(1).max(100).nullish(),
    state: z.string().min(1).max(100).nullish(),
    country: z.string().min(1).max(100).nullish(),
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
    .min(0, "At least one timeslot is required"),
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

const sendClassRequestNotificationSchema = z.object({
  lessonId: z
    .string()
    .regex(objectIdRegex, "Invalid MongoDB ObjectId format"),
}).strict();

const markNotificationsAsReadSchema = z.object({
  notificationIds: z.array(z.string().regex(objectIdRegex, "Invalid MongoDB ObjectId format")).min(1, "At least one notification ID is required").max(100, "Cannot mark more than 100 notifications as read at once"),
}).strict();

const verifyTutorPayoutSchema = z.object({
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
}).strict();

const addMeetingLinkHandlerSchema = z.object({
    lessonId: z.string().regex(objectIdRegex, "Invalid MongoDB ObjectId format"),
    meetingLink: z.string().url()
}).strict();

const verifyPaymentSchema = z.object({
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
})

export {
    tutorSchema,
    tutorLocationSchema,
    tutorAvailabilitySchema,
    getSubjectsQuerySchema,
    sendClassRequestNotificationSchema,
    markNotificationsAsReadSchema,
    verifyTutorPayoutSchema,
    addMeetingLinkHandlerSchema,
    verifyPaymentSchema
};
