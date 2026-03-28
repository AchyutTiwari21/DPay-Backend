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

            const studentProfile = await StudentProfile.findById(studentId);
            const tutorProfile = await TutorProfile.findById(lesson.tutor).populate('user');

            if(studentProfile.tutors.includes(lesson.tutor)) {
                const tuition = await Tution.findOne({ tutor: lesson.tutor, student: studentId });
                if(!tuition) {
                    return res.status(404).json(new ApiResponse(404, null, "Tuition not found for existing tutor-student pair"));
                }

                if(!tuition.subjects.includes(lesson.subject._id)) {
                    tuition.subjects.push(lesson.subject._id);
                }
                await tuition.save();
                res.status(200).json(new ApiResponse(200, null, "Class request accepted. Student already has this tutor, subject added to profile."));
                await mailSender(
                    tutorProfile.user?.email,
                    "Class Request Accepted",
                    `Your class request for ${lesson.subject?.name} has been accepted by the student. Please log in update schedule and other details.`
                );
                return;
            } 
            

            const tution = new Tution({
                tutor: lesson.tutor,
                student: studentId,
                title: `${lesson.subject?.name}`,
                status: "CONFIRMED",
                subjects: [lesson.subject]
            });
            await tution.save();

            studentProfile.tutions.push(tution._id);
            studentProfile.tutors.push(lesson.tutor);
            await studentProfile.save();
            
            tutorProfile.tutions.push(tution._id);
            tutorProfile.students.push(studentId); 
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