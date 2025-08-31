import { Subject } from "../../models/index.js";
import { asyncHandler, ApiResponse } from "../../utils/index.js";

export const getSubjects = asyncHandler(async (req, res) => {
    const { cursor, direction = "forward", limit = 20 } = req.query;
    let query = {};
    let sort = { _id: 1 }; // default ascending (forward)

    // If cursor exists, modify query based on direction
    if (cursor) {
        if (direction === "forward") {
            query._id = { $gt: cursor };
            sort = { _id: 1 }; 
        } else if (direction === "backward") {
            query._id = { $lt: cursor };
            sort = { _id: -1 }; // fetch in reverse
        }
    }

    try {
        const subjects = await Subject.find(query).sort(sort).limit(Number(limit));

        // If backward, reverse results to maintain ascending order for UI
        if (direction === "backward") {
            subjects = subjects.reverse();
        }

        // Cursors
        const nextCursor = subjects.length > 0 ? subjects[subjects.length - 1]._id : null;
        const prevCursor = subjects.length > 0 ? subjects[0]._id : null;

        return res.status(200).json(
            new ApiResponse(
                true, 
                { subjects, nextCursor, prevCursor },
                "Subjects retrieved successfully"
            )
        );
    } catch (error) {
        console.error("Error retrieving subjects:", error.message);
        return res.status(500).json(new ApiResponse(false, null, "Internal Server Error"));
    }
});
