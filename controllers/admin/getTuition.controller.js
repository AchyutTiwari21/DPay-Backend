import mongoose from "mongoose";
import { Tution } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";

const buildPriceRangeMatch = ({ priceRange, minPrice, maxPrice }) => {
    if (minPrice !== undefined || maxPrice !== undefined) {
        const match = {};
        if (minPrice !== undefined && minPrice !== "") {
            match.$gte = Number(minPrice);
        }
        if (maxPrice !== undefined && maxPrice !== "") {
            match.$lte = Number(maxPrice);
        }
        return Object.keys(match).length ? { fees: match } : null;
    }

    if (!priceRange || String(priceRange).toLowerCase() === "all") {
        return null;
    }

    const raw = String(priceRange).trim();
    const betweenMatch = raw.match(/^(\d+)\s*-\s*(\d+)$/);
    if (betweenMatch) {
        return {
            fees: {
                $gte: Number(betweenMatch[1]),
                $lte: Number(betweenMatch[2]),
            }
        };
    }

    const minPlusMatch = raw.match(/^(\d+)\s*\+$/);
    if (minPlusMatch) {
        return {
            fees: {
                $gte: Number(minPlusMatch[1]),
            }
        };
    }

    return null;
};

export const getTuitions = asyncHandler(async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            subject,
            status,
            priceRange,
            minPrice,
            maxPrice,
        } = req.query;

        const pageNumber = Number(page) || 1;
        const perPage = Number(limit) || 10;
        const skip = (pageNumber - 1) * perPage;

        const pipeline = [
            {
                $lookup: {
                    from: "tutorprofiles",
                    localField: "tutor",
                    foreignField: "_id",
                    as: "tutor",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "user",
                                foreignField: "_id",
                                as: "user",
                                pipeline: [{ $project: { _id: 1, name: 1, email: 1 } }]
                            }
                        },
                        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                        { $project: { _id: 1, user: 1 } }
                    ]
                }
            },
            { $unwind: { path: "$tutor", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "studentprofiles",
                    localField: "student",
                    foreignField: "_id",
                    as: "student",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "user",
                                foreignField: "_id",
                                as: "user",
                                pipeline: [{ $project: { _id: 1, name: 1, email: 1 } }]
                            }
                        },
                        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                        { $project: { _id: 1, user: 1 } }
                    ]
                }
            },
            { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjects",
                    foreignField: "_id",
                    as: "subjects",
                    pipeline: [{ $project: { _id: 1, name: 1, category: 1 } }]
                }
            },
            {
                $addFields: {
                    tutorName: "$tutor.user.name",
                    studentName: "$student.user.name",
                    subjectNames: {
                        $map: {
                            input: "$subjects",
                            as: "subject",
                            in: "$$subject.name",
                        }
                    }
                }
            }
        ];

        if (search) {
            const regex = new RegExp(search, "i");
            pipeline.push({
                $match: {
                    $or: [
                        { title: regex },
                        { tutorName: regex },
                        { studentName: regex },
                        { subjectNames: regex },
                    ]
                }
            });
        }

        if (subject && String(subject).toLowerCase() !== "all") {
            const subjectList = String(subject)
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean);

            if (subjectList.length > 0) {
                pipeline.push({
                    $match: {
                        subjectNames: { $in: subjectList }
                    }
                });
            }
        }

        if (status && String(status).toLowerCase() !== "all") {
            const statusList = String(status)
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean);

            if (statusList.length > 0) {
                pipeline.push({
                    $match: {
                        status: { $in: statusList }
                    }
                });
            }
        }

        const priceMatch = buildPriceRangeMatch({ priceRange, minPrice, maxPrice });
        if (priceMatch) {
            pipeline.push({ $match: priceMatch });
        }

        pipeline.push(
            {
                $project: {
                    _id: 1,
                    title: 1,
                    startDate: 1,
                    endDate: 1,
                    schedule: 1,
                    status: 1,
                    fees: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    tutor: 1,
                    student: 1,
                    subjects: 1,
                    tutorName: 1,
                    studentName: 1,
                    subjectNames: 1,
                }
            },
            { $sort: { createdAt: -1, _id: 1 } }
        );

        const [tuitions, statsResults] = await Promise.all([
            Tution.aggregate([...pipeline, { $skip: skip }, { $limit: perPage }]),
            Promise.all([
                Tution.aggregate([...pipeline, { $count: "total" }]),
                Tution.countDocuments(),
                Tution.countDocuments({ status: "ONGOING" }),
                Tution.countDocuments({ status: "COMPLETED" }),
                Tution.countDocuments({ status: "CANCELLED" }),
            ])
        ]);

        const [totalAgg, totalTuitions, activeTuitions, completedTuitions, cancelledTuitions] = statsResults;
        const total = totalAgg.length > 0 ? totalAgg[0].total : 0;
        const totalPages = Math.ceil(total / perPage);

        return res.status(200).json(new ApiResponse(
            200,
            {
                tuitions,
                totalPages,
                currentPage: pageNumber,
                totalTuitions,
                activeTuitions,
                completedTuitions,
                cancelledTuitions,
                stats: {
                    totalTuitions,
                    total,
                    activeTuitions,
                    completedTuitions,
                    cancelledTuitions,
                }
            },
            "Tuitions fetched successfully"
        ));
    } catch (error) {
        console.error("getTuitions error:", error);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});

export const getTutionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid tution id"));
    }

    const tution = await Tution.findById(id).populate({
        path: "tutor",
        select: "user",
        populate: {
            path: "user",
            select: "name email"
        }
    }).populate({
        path: "student",
        select: "user",
        populate: {
            path: "user",
            select: "name email"
        }
    }).populate("subjects", "name");

    if (!tution) {
        return res.status(404).json(new ApiResponse(404, null, "Tution not found"));
    }

    res.status(200).json(new ApiResponse(200, tution, "Tution fetched successfully"));
});
