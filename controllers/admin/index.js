import { 
    getAllTeacherRequests, 
    updateTeacherRequest 
} from "./teacherRequests.controller.js";
import { 
    addTutor,
    getTutors,
    getTutor,
    removeTutor,
    addSubject,
    removeSubject
} from "./addTutor.controller.js";
import { getDashboardStats } from "./getDashboardStats.controller.js";

export {
    getAllTeacherRequests,
    updateTeacherRequest,
    addTutor,
    getTutors,
    getTutor,
    removeTutor,
    addSubject,
    removeSubject,
    getDashboardStats
};
