import { z } from "zod";

// Regex for MongoDB ObjectId (24 hex characters)
const objectIdRegex = /^[a-f\d]{24}$/i;

const acceptRejectClassRequestSchema = z.object({
    notificationId: z.string().regex(objectIdRegex, "Invalid MongoDB ObjectId format"),
    studentId: z.string().regex(objectIdRegex, "Invalid MongoDB ObjectId format"),
    status: z.enum(["ACCEPTED", "REJECTED"], {
        errorMap: () => ({ message: "Status must be either 'ACCEPTED' or 'REJECTED'" }),
    }),
}).strict();

const markNotificationsAsReadSchema = z.object({
  notificationIds: z.array(z.string().regex(objectIdRegex, "Invalid MongoDB ObjectId format")).min(1, "At least one notification ID is required").max(100, "Cannot mark more than 100 notifications as read at once"),
}).strict();

export { 
    acceptRejectClassRequestSchema,
    markNotificationsAsReadSchema
};
