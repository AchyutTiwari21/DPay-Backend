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
}).strict();

export { 
    acceptRejectClassRequestSchema,
    markNotificationsAsReadSchema,
    verifyPaymentSchema
};
