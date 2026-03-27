import { StudentProfile } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";

export const getStudentTution = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const student = await StudentProfile.findOne({ user: userId }).populate({
        path: "tutions",
        select: "tutor title startDate endDate schedule status fees subjects",
        populate: [
            {
                path: "tutor",
                select: "user",
                populate: {
                    path: "user",
                    select: "name email avatar",
                },
            },
            {
                path: "subjects",
                select: "name",
            },
        ],
    });

    if (!student) {
      return res.status(404).json(new ApiResponse(404, "Student not found"));
    }

    res.status(200).json(new ApiResponse(200,  student.tutions, "Student tutions retrieved successfully"));
});

export const getStudentTutor = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const student = await StudentProfile.findOne({ user: userId }).populate({
        path: "tutors",
        select: "user",
        populate: {
            path: "user",
            select: "name email avatar phone",
        },
    });

    if (!student) {
      return res.status(404).json(new ApiResponse(404, "Student not found"));
    }

    const tutors = student.tutors;
    res.status(200).json(new ApiResponse(200, tutors, "Student tutors retrieved successfully"));    
});
