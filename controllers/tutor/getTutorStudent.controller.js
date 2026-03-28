import { asyncHandler, ApiResponse } from "../../utils/index.js";
import { TutorProfile, Tution } from "../../models/index.js";

export const getTutorStudents = asyncHandler(async (req, res) => {
    try {
        const userId = req?.user?._id;
        if(!userId) {
            return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
        }
        const tutorProfile = await TutorProfile.findOne({ user: userId }).populate({    
            path: "students",
            select: "user",
            populate: {
                path: "user",
                select: "name email avatar phone",
            }
        });
        if(!tutorProfile) {
            return res.status(404).json(new ApiResponse(404, null, "Tutor profile not found"));
        }
        return res.status(200).json(new ApiResponse(200, tutorProfile.students, "Students retrieved successfully"));
    } catch (error) {
        console.error("Error fetching tutor students:", error);
        return res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});

export const getTuitions = asyncHandler(async (req, res) => {
    try {
        const userId = req?.user?._id;
        if(!userId) {
            return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
        }
        const tutorProfile = await TutorProfile.findOne({ user: userId }).populate({
            path: "tutions",
            select: "student title startDate endDate schedule status fees subjects",
            populate: [
                {
                    path: "student",
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

        if(!tutorProfile) {
            return res.status(404).json(new ApiResponse(404, null, "Tutor profile not found"));
        }
        return res.status(200).json(new ApiResponse(200, tutorProfile.tutions, "Tuitions retrieved successfully"));
    } catch (error) {
        console.error("Error fetching tutor tuitions:", error);
        return res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});

export const addTuitionData = asyncHandler(async (req, res) => {
    try {
        const userId = req?.user?._id;
        if(!userId) {
            return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
        }
        const tutorProfile = await TutorProfile.findOne({ user: userId });
        if(!tutorProfile) {
            return res.status(404).json(new ApiResponse(404, null, "Tutor profile not found"));
        }
        const { tutionId } = req.params;
        const { title, startDate, endDate, schedule, status, fees } = req.body;

        const tuition = await Tution.findById(tutionId);
        if(!tuition) {
            return res.status(404).json(new ApiResponse(404, null, "Tuition not found"));
        }
        if(tuition.tutor.toString() !== tutorProfile._id.toString()) {
            return res.status(403).json(new ApiResponse(403, null, "Unauthorized to update this tuition"));
        }
        if(title) tuition.title = title;
        if(startDate) tuition.startDate = startDate;
        if(endDate) tuition.endDate = endDate;
        if(schedule) tuition.schedule = schedule;
        if(status) tuition.status = status;
        if(fees) tuition.fees = fees;
        await tuition.save();
        return res.status(200).json(new ApiResponse(200, tuition, "Tuition updated successfully"));
    } catch (error) {
        console.error("Error updating tuition data:", error);
        return res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});
