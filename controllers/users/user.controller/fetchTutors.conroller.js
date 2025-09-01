import { TutorProfile, User, Subject } from "../../../models/index.js";
import { ApiResponse, asyncHandler } from "../../../utils/index.js";

export const getTutors = asyncHandler(async (req, res) => {
    const { cursor, direction = "forward", limit = 7, search, language, minPrice, maxPrice } = req.query;

    try {
        let pipeline = [];

        // 🔹 If cursor exists (pagination)
        if (cursor) {
            pipeline.push({
                $match: {
                    _id: {
                        [direction === "forward" ? "$gt" : "$lt"]: new mongoose.Types.ObjectId(cursor)
                    }
                }
            });
        }

        // 🔹 Language filter
        if (language && language !== "Any") {
            pipeline.push({
                $match: {
                    languages: { $regex: new RegExp(language, "i") }
                }
            });
        }

        // 🔹 Price Range filter
        if (minPrice && maxPrice) {
            pipeline.push({
                $match: {
                    pricePerHour: {
                        $gte: Number(minPrice),
                        $lte: Number(maxPrice)
                    }
                }
            });
        }

        if (search) {
            const regex = new RegExp(search, "i");

            // 1️⃣ Get matching subject IDs
            const subjectIds = await Subject.find({ name: regex }).distinct("_id");

            // 2️⃣ Add computed "score" field
            pipeline.push({
                $addFields: {
                    score: {
                        $add: [
                            { $cond: [{ $regexMatch: { input: "$title", regex } }, 1, 0] },
                            { $cond: [{ $gt: [{ $size: { $filter: { input: "$skills", as: "s", cond: { $regexMatch: { input: "$$s", regex } } } } }, 0] }, 3, 0] },
                            { $cond: [{ $gt: [{ $size: { $filter: { input: "$languages", as: "l", cond: { $regexMatch: { input: "$$l", regex } } } } }, 0] }, 1, 0] },
                            { $cond: [{ $in: ["$subjects", subjectIds] }, 4, 0] }
                        ]
                    }
                }
            });

            // 3️⃣ Keep only tutors with score > 0
            pipeline.push({
                $match: { score: { $gt: 0 } }
            });
        }

        // 🔹 Sorting
        pipeline.push({ $sort: { score: -1, _id: direction === "forward" ? 1 : -1 } });

        // 🔹 Limit
        pipeline.push({ $limit: Number(limit) });

        // 🔹 Lookup for user and subjects
        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjects",
                    foreignField: "_id",
                    as: "subjects"
                }
            }
        );

        let tutors = await TutorProfile.aggregate(pipeline);

        // 🔹 If backward, reverse results for UI consistency
        if (direction === "backward") {
            tutors = tutors.reverse();
        }

        const nextCursor = tutors.length > 0 ? tutors[tutors.length - 1]._id : null;
        const prevCursor = tutors.length > 0 ? tutors[0]._id : null;

        return res.status(200).json(new ApiResponse(
            true,
            { tutors, prevCursor, nextCursor },
            "Tutors retrieved successfully"
        ));
    } catch (error) {
        console.error("Error retrieving tutors:", error.message);
        return res.status(500).json(new ApiResponse(false, null, "Internal Server Error"));
    }
});
