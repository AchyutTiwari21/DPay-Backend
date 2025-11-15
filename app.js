import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 10 requests per minute
});

app.use(limiter);

app.use(express.json({limit: "1mb"}));
app.use(express.urlencoded({extended: true, limit: "1mb"}));
app.use(express.static("public"));
app.use(cookieParser());

app.get('/keep-alive', (req, res) => {
  return res.status(200).send('OK');
});

import authRouter from "./routes/user.route/auth.route.js";
import userRouter from "./routes/user.route/user.route.js";
import adminRouter from "./routes/admin.route/admin.route.js";
import tutorRouter from "./routes/tutor.route/tutor.route.js";
import studentRouter from "./routes/student.route/student.controller.js";
import webhookRouter from "./routes/user.route/webhook.route.js";

app.use("/api/webhook", webhookRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/tutor", tutorRouter);
app.use("/api/student", studentRouter);

import { startCleanupJob } from "./utils/cleanup.js";
startCleanupJob();

export { app };
