import { Router } from "express";
import { 
    getAllTeacherRequests, 
    updateTeacherRequest,
    removeTeacherRequest,
    addTutor,
    getTutors,
    getTutor,
    removeTutor,
    verifyTutor,
    addSubject,
    removeSubject,
    getDashboardStats,
    getDashboardGrowth,
    getLatestStudents,
    getLatestPendingTutorApplications,
    getUpcomingDemos,
    getStudents,
    getStudent,
    getStudentGrowth,
    updateStudentStatus,
    createPaymentRequest,
    getUpcomingDemoBookings,
    removeBooking
} from "../../controllers/admin/index.js";
import { verifyJWT, verifyAdmin } from "../../middlewares/index.js";

const router = Router();

router.route("/teacher-requests").get(verifyJWT, verifyAdmin, getAllTeacherRequests);

router.route("/update-teacher-request/:id").put(verifyJWT, verifyAdmin,  updateTeacherRequest);

router.route("/remove-teacher-request/:id").delete(verifyJWT, verifyAdmin,  removeTeacherRequest);

router.route("/add-tutor").post(verifyJWT, verifyAdmin, addTutor);

router.route("/get-tutors").get(verifyJWT, verifyAdmin, getTutors);

router.route("/get-tutor/:tutorId").get(verifyJWT, verifyAdmin, getTutor);

router.route("/remove-tutor/:tutorId").delete(verifyJWT, verifyAdmin, removeTutor);

router.route("/verify-tutor/:tutorId").put(verifyJWT, verifyAdmin, verifyTutor);

router.route("/add-subject").post(verifyJWT, verifyAdmin, addSubject);

router.route("/remove-subject/:subjectId").delete(verifyJWT, verifyAdmin, removeSubject);   

router.route("/dashboard-stats").get(verifyJWT, verifyAdmin, getDashboardStats);

router.route("/dashboard-growth").get(verifyJWT, verifyAdmin, getDashboardGrowth);

router.route("/latest-students").get(verifyJWT, verifyAdmin, getLatestStudents);

router.route("/latest-applications").get(verifyJWT, verifyAdmin, getLatestPendingTutorApplications);

router.route("/upcoming-demos").get(verifyJWT, verifyAdmin, getUpcomingDemos);

router.route("/get-student/:userId").get(verifyJWT, verifyAdmin, getStudent);

router.route("/get-students").get(verifyJWT, verifyAdmin, getStudents);

router.route("/get-student-growth").get(verifyJWT, verifyAdmin, getStudentGrowth);

router.route("/update-student/:studentId").put(verifyJWT, verifyAdmin, updateStudentStatus);

router.route("/create-payment-request").post(verifyJWT, verifyAdmin, createPaymentRequest);

router.route("/get-upcoming-demo-bookings").get(verifyJWT, verifyAdmin, getUpcomingDemoBookings);

router.route("/remove-booking/:bookingId").delete(verifyJWT, verifyAdmin, removeBooking);

export default router;
