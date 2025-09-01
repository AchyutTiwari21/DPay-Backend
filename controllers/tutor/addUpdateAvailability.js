import { TutorProfile, Availability } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";

export const addAvailability = asyncHandler(async (req, res) => {
    const user = req.user;

    const { day, timeslots } = req.body;

    try {
        const availability = new Availability({
            day,
            timeslots,
            tutor: user._id
        });

        await availability.save();

        await TutorProfile.findOneAndUpdate(
            { user: user._id },
            { $push: { availability: availability._id } },
            { new: true }
        );

        return res.status(201).json(new ApiResponse(true, availability, "Availability added successfully"));
    } catch (error) {
        console.error("Error adding availability:", error.message);
        return res.status(500).json(new ApiResponse(false, null, "Internal Server Error"));
    }
});

export const updateAvailability = asyncHandler(async (req, res) => {
    const user = req.user;
    const { availabilityId, day, timeslots } = req.body;

    try {
        const availability = await Availability.findOneAndUpdate(
            { _id: availabilityId, tutor: user._id },
            { day, timeslots },
            { new: true }
        );

        if (!availability) {
            return res.status(404).json(new ApiResponse(false, null, "Availability not found"));
        }

        return res.status(200).json(new ApiResponse(true, availability, "Availability updated successfully"));
    } catch (error) {
        console.error("Error updating availability:", error.message);
        return res.status(500).json(new ApiResponse(false, null, "Internal Server Error"));
    }
});

export const deleteAvailability = asyncHandler(async (req, res) => {
    const user = req.user;
    const { availabilityId } = req.body;

    try {
        // Delete the specific availability
        const availability = await Availability.findOneAndDelete({ _id: availabilityId, tutor: user._id });

        if(!availability){
            return res.status(404).json(new ApiResponse(false, null, "Availability not found"));
        }

        // Pull from TutorProfile
        await TutorProfile.findOneAndUpdate(
            { user: user._id },
            { $pull: { availability: availabilityId } },
            { new: true }
        );

        return res.status(200).json(new ApiResponse(true, null, "Availability deleted successfully"));
    } catch (error) {
        console.error("Error deleting availability:", error.message);
        return res.status(500).json(new ApiResponse(false, null, "Internal Server Error"));
    }
});
