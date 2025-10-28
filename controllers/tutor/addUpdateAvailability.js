import { TutorProfile, Availability } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";

export const addAvailability = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if(!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    }

    const { tutorId, availabilities } = req.body;

    try {
        const tutorProfile = await TutorProfile.findOne({ user: userId });

        if (!tutorProfile || tutorProfile._id.toString() !== tutorId) {
            return res.status(403).json(new ApiResponse(403, null, "Forbidden: You can only add availability to your own profile"));
        }

        await Availability.deleteMany({ tutor: tutorId });

        await TutorProfile.findByIdAndUpdate(
            tutorId,
            { $set: { availability: [] } }
        );

        availabilities.forEach(async (availabilityData) => {
            const { day, timeslots } = availabilityData;

            const availability = new Availability({
                day,
                timeslots,
                tutor: tutorId
            });

            await availability.save();

            await TutorProfile.findByIdAndUpdate(
                tutorId,
                { $push: { availability: availability._id } }
            );
        });

        return res.status(201).json(new ApiResponse(201, null, "Availability added successfully"));
    } catch (error) {
        console.error("Error adding availability:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});
