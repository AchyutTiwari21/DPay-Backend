import { updateTutorProfile, getTutorProfile, addUpdateTutorAvatar } from "./getUpdateTutorProfile.controller.js";
import { addAvailability } from "./addUpdateAvailability.js";
import { getDashboardStats } from "./dashboardStats.controller.js";
import { getDemoSessions, getBookingTrends, getDemoStats, getDemoSessionsHandler, sendClassRequestNotification } from "./getDemoSession.controller.js";
import { getTutor } from "./getTutorDetail.controller.js";
import { markNotificationsAsRead, removeNotification } from "./notificationRead.controller.js";

export {
    updateTutorProfile,
    getTutorProfile,
    addUpdateTutorAvatar,
    addAvailability,
    getDashboardStats,
    getDemoSessions,
    getBookingTrends,
    getDemoStats,
    getTutor,
    getDemoSessionsHandler,
    sendClassRequestNotification,
    markNotificationsAsRead,
    removeNotification
};