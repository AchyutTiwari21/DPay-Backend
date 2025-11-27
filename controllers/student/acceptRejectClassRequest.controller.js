import { StudentProfile, TutorProfile, Notification, Lesson, Tution } from "../../models/index.js";
import { asyncHandler, ApiResponse } from "../../utils/index.js";
import { mailSender } from "../../utils/mailSender.js";

export const acceptRejectClassRequest = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { notificationId, studentId, status } = req.body;

    try {
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json(new ApiResponse(404, null, "Notification not found"));
        }

        if(notification.user.toString() !== userId.toString()) {
            return res.status(403).json(new ApiResponse(403, null, "Unauthorized action"));
        }

        if(status !== "ACCEPTED" && status !== "REJECTED") {
            return res.status(400).json(new ApiResponse(400, null, "Invalid status value"));
        }

        if(status === "ACCEPTED") {
            const lesson = await Lesson.findById(notification.lesson).populate('subject');
            if (!lesson) {
                return res.status(404).json(new ApiResponse(404, null, "Lesson not found"));
            }

            const tution = new Tution({
                tutor: lesson.tutor,
                student: studentId,
                title: `Tution for ${lesson.subject?.name}`,
                status: "CONFIRMED",
                subjects: [lesson.subject]
            });
            await tution.save();

            const studentProfile = await StudentProfile.findById(studentId);
            studentProfile.tutions.push(tution._id);
            if(!studentProfile.tutors.includes(lesson.tutor)) studentProfile.tutors.push(lesson.tutor);
            await studentProfile.save();


            const tutorProfile = await TutorProfile.findById(lesson.tutor).populate('user');
            tutorProfile.tutions.push(tution._id);
            if(!tutorProfile.students.includes(studentId)) {
                tutorProfile.students.push(studentId);
            }
            await tutorProfile.save();

            res.status(200).json(new ApiResponse(200, tution, "Class request accepted."));
            await mailSender(
                tutorProfile.user?.email,
                "Class Request Accepted",
                `Your class request for ${lesson.subject?.name} has been accepted by the student. Please log in update schedule and other details.`
            );
            return;
        } else if(status === "REJECTED") {
            res.status(200).json(new ApiResponse(200, null, "Class request rejected."));
            const lesson = await Lesson.findById(notification.lesson);
            if (!lesson) {
                return;
            }
            const tutorProfile = await TutorProfile.findById(lesson.tutor).populate('user');
            await mailSender(
                tutorProfile.user?.email,
                "Class Request Rejected",
                `Your class request has been rejected by the student. You may consider sending a request to another student.`
            );
            return;
        }

    } catch (error) {
        console.error("Error in acceptRejectClassRequest:", error);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});