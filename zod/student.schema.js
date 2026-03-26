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

const profileUpdateSchema = z.object({
    name: z.string()
        .min(1, "Name is required")
        .max(100, "Name is too long"),
    
    email: z.string()
        .email("Invalid email format")
        .min(1, "Email is required"),
    
    phone: z.string()
        .min(10, "Phone number must be at least 10 characters")
        .max(15, "Phone number is too long"),
    
    address: z.string()
        .min(1, "Address is required")
        .max(255, "Address is too long"),
    
    schoolBoard: z.string()
        .min(1, "School board is required")
        .max(100),

    // Avatar is usually optional and comes from req.file
    avatar: z.string().optional().nullish(),
}).strict();

export { 
    acceptRejectClassRequestSchema,
    markNotificationsAsReadSchema,
    verifyPaymentSchema,
    profileUpdateSchema
};
