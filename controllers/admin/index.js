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
import { getStudentDetail, getStudents, getStudentGrowth, updateStudentStatus } from "./studentDetail.controller.js";
import { createPaymentRequest } from "./tutorPaymentRequest.controller.js";

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
    getStudentDetail,
    getStudents,
    getStudentGrowth,
    updateStudentStatus,
    createPaymentRequest,
};
