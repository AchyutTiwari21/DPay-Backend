import { 
    getAllTeacherRequests, 
    updateTeacherRequest,
    removeTeacherRequest 
} from "./teacherRequests.controller.js";
import { 
    addTutor,
    getTutors,
    getTutor,
    removeTutor,
    addSubject,
    removeSubject,
    verifyTutor
} from "./addTutor.controller.js";
import { getDashboardStats } from "./getDashboardStats.controller.js";
import { getDashboardGrowth } from "./getDashboardGrowth.controller.js";
import { getLatestStudents, getLatestPendingTutorApplications } from "./getDashboardData.controller.js";
import { getUpcomingDemos } from "./getUpcomingDemos.controller.js";
import { getStudent, removeStudent, getStudents, getStudentGrowth, updateStudentStatus } from "./studentDetail.controller.js";
import { createPaymentRequest } from "./tutorPaymentRequest.controller.js";
import { getUpcomingDemoBookings, removeBooking } from "./getUpcomingDemoBookings.controller.js";
import { getPayments, removePayment } from "./payment.controller.js";
import { updateAdminCredentials } from "./updateAdminController.js";
import { getAllReferrals, acceptRejectReferral } from "./referral.controller.js";
import { getNotifications, markNotificationsAsRead, removeNotification } from "./getNotifications.controller.js";

export {
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
    getStudent,
    removeStudent,
    getStudents,
    getStudentGrowth,
    updateStudentStatus,
    createPaymentRequest,
    getUpcomingDemoBookings,
    removeBooking,
    getPayments,
    removePayment,
    updateAdminCredentials,
    getAllReferrals,
    acceptRejectReferral,
    getNotifications,
    markNotificationsAsRead,
    removeNotification
};
