import { updateTutorProfile, getTutorProfile } from "./getUpdateTutorProfile.controller.js";
import { addAvailability } from "./addUpdateAvailability.js";
import { getDashboardStats } from "./dashboardStats.controller.js";
import { getDemoSessions, getBookingTrends, getDemoStats } from "./getDemoSession.controller.js";
import { getTutor } from "./getTutorDetail.controller.js";
import { getDemoSessionsHandler } from "./getDemoSession.controller.js";

export {
    updateTutorProfile,
    getTutorProfile,
    addAvailability,
    getDashboardStats,
    getDemoSessions,
    getBookingTrends,
    getDemoStats,
    getTutor,
    getDemoSessionsHandler
};