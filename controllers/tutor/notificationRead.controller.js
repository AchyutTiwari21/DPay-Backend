import { Notification, TutorProfile } from "../../models/index.js";
import { asyncHandler, ApiResponse } from "../../utils/index.js";

export const markNotificationsAsRead = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }
    try {
        const { notificationIds } = req.body;
        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json(new ApiResponse(400, null, "Invalid notification IDs"));
        }
        await Notification.updateMany(
            { _id: { $in: notificationIds }, user: userId },
            { $set: { isRead: true } }
        );
        return res.status(200).json(new ApiResponse(200, null, "Notifications marked as read"));
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});

export const removeNotification = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }
    try {
        const { notificationId } = req.params;
        const deletionResult = await Notification.deleteOne({ _id: notificationId, user: userId });
        if (deletionResult.deletedCount === 0) {
            return res.status(404).json(new ApiResponse(404, null, "Notification not found"));
        }

        await TutorProfile.updateOne(
            { user: userId },
            { $pull: { notifications: notificationId } }
        );

        return res.status(200).json(new ApiResponse(200, null, "Notification removed successfully"));
    } catch (error) {
        console.error("Error removing notification:", error);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});
