import { updateTutorProfile, getTutorProfile } from "./getUpdateTutorProfile.controller.js";
import { addAvailability, updateAvailability, deleteAvailability } from "./addUpdateAvailability.js";
import { getDashboardStats } from "./dashboardStats.controller.js";
import { getDemoSessions, getBookingTrends, getDemoStats } from "./getDemoSession.controller.js";
import { getTutor } from "./getTutorDetail.controller.js";

export {
    updateTutorProfile,
    getTutorProfile,
    addAvailability,
    updateAvailability,
    deleteAvailability,
    getDashboardStats,
    getDemoSessions,
    getBookingTrends,
    getDemoStats,
    getTutor
};