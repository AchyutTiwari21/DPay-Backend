import { Referral, User } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";

export const getAllReferrals = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search,
        status,
        subjects,
        dateFrom,
        dateTo
    } = req.query;

    try {
        const pageNumber = Number(page);
        const perPage = Number(limit);
        const skip = (pageNumber - 1) * perPage;

        let pipeline = [];

        // Date range filter
        if (dateFrom || dateTo) {
            let dateFilter = {};
            if (dateFrom) dateFilter.$gte = new Date(dateFrom);
            if (dateTo) dateFilter.$lte = new Date(dateTo);
            pipeline.push({ $match: { createdAt: dateFilter } });
        }

        // Status filter - convert frontend status to backend status
        let statusMatch = {};
        if (status) {
            const statusArray = Array.isArray(status) ? status : status.split(',');
            const mappedStatuses = statusArray.map(s => {
                if (s === 'Pending') return 'PENDING';
                if (s === 'Approved') return 'ACCEPTED';
                if (s === 'Rejected') return 'REJECTED';
                return s;
            });
            if (mappedStatuses.length > 0) {
                statusMatch.status = { $in: mappedStatuses };
            }
        }

        // Subjects filter
        if (subjects) {
            const subjectArray = Array.isArray(subjects) ? subjects : subjects.split(',');
            if (subjectArray.length > 0) {
                statusMatch.subjectToTeach = { $in: subjectArray };
            }
        }

        if (Object.keys(statusMatch).length > 0) {
            pipeline.push({ $match: statusMatch });
        }

        // Lookup referrer details
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "referrer",
                foreignField: "_id",
                as: "referrerDetails",
                pipeline: [
                    { $project: { name: 1, email: 1, phone: 1 } }
                ]
            }
        });
        pipeline.push({ $unwind: { path: "$referrerDetails", preserveNullAndEmptyArrays: true } });

        // Text search filter
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { "referrerDetails.name": { $regex: search, $options: "i" } },
                        { "referrerDetails.email": { $regex: search, $options: "i" } },
                        { "studentName": { $regex: search, $options: "i" } },
                        { "studentEmail": { $regex: search, $options: "i" } }
                    ]
                }
            });
        }

        // Add sort
        pipeline.push({ $sort: { createdAt: -1 } });

        // Format output
        pipeline.push({
            $project: {
                id: "$_id",
                referrer: {
                    id: "$referrerDetails._id",
                    name: "$referrerDetails.name",
                    email: "$referrerDetails.email",
                    phone: "$referrerDetails.phone"
                },
                referredStudent: {
                    id: "$_id",
                    name: "$studentName",
                    email: "$studentEmail",
                    phone: "$studentPhone"
                },
                subject: "$subjectToTeach",
                status: {
                    $cond: [
                        { $eq: ["$status", "PENDING"] },
                        "Pending",
                        {
                            $cond: [
                                { $eq: ["$status", "ACCEPTED"] },
                                "Approved",
                                "Rejected"
                            ]
                        }
                    ]
                },
                rewardCoins: 1,
                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                linkedTutorAccountId: "$referrer",
                studentPhone: 1,
                location: 1
            }
        });

        // Execute aggregation with pagination
        const [referrals, statsResults] = await Promise.all([
            // Main referrals query
            Referral.aggregate([...pipeline, { $skip: skip }, { $limit: perPage }]),

            // Stats queries
            Promise.all([
                // Total filtered count
                Referral.aggregate([...pipeline, { $count: "total" }]),

                // Total referrals
                Referral.aggregate([
                    { $group: { _id: null, total: { $sum: 1 } } }
                ]),

                // Approved referrals
                Referral.aggregate([
                    { $match: { status: "ACCEPTED" } },
                    { $group: { _id: null, total: { $sum: 1 } } }
                ]),

                // Pending referrals
                Referral.aggregate([
                    { $match: { status: "PENDING" } },
                    { $group: { _id: null, total: { $sum: 1 } } }
                ]),

                // Total coins distributed
                Referral.aggregate([
                    { $match: { status: "ACCEPTED" } },
                    { $group: { _id: null, total: { $sum: "$rewardCoins" } } }
                ])
            ])
        ]);

        // Process stats results
        const [totalAgg, totalReferrals, approvedReferrals, pendingReferrals, coinsDistributed] = statsResults;
        const total = totalAgg.length > 0 ? totalAgg[0].total : 0;
        const totalPages = Math.ceil(total / perPage);

        // Format the response
        return res.status(200).json(new ApiResponse(
            200,
            {
                referrals,
                pagination: {
                    total,
                    totalPages,
                    currentPage: pageNumber,
                    perPage
                },
                stats: {
                    totalReferrals: totalReferrals[0]?.total || 0,
                    conversions: approvedReferrals[0]?.total || 0,
                    pending: pendingReferrals[0]?.total || 0,
                    distributed: coinsDistributed[0]?.total || 0
                }
            },
            "Referrals retrieved successfully"
        ));

    } catch (error) {
        console.error("Error retrieving referrals:", error);
        return res.status(500).json(new ApiResponse(
            500,
            null,
            "Internal Server Error"
        ));
    }
});

export const acceptRejectReferral = asyncHandler(async (req, res) => {
    const { referralId } = req.params;
    const { action } = req.body;

    try {
        const referral = await Referral.findById(referralId);
        if (!referral) {
            return res.status(404).json(new ApiResponse(
                404,
                null,
                "Referral not found"
            ));
        }

        const user = await User.findById(referral.referrer);
        if (!user) {
            return res.status(404).json(new ApiResponse(
                404,
                null,
                "Referrer user not found"
            ));
        }

        if (action === "accept") {
            referral.status = "ACCEPTED";
            referral.rewardCoins = 100; // Example reward coins for accepted referral
            user.rewardCoins += referral.rewardCoins;
            await user.save();
        } else if (action === "reject") {
            referral.status = "REJECTED";
            referral.rewardCoins = 0;
        } else {
            return res.status(400).json(new ApiResponse(
                400,
                null,
                "Invalid action. Must be 'accept' or 'reject'."
            ));
        }
        await referral.save();
        return res.status(200).json(new ApiResponse(
            200,
            referral,
            "Referral updated successfully"
        ));
    } catch (error) {
        console.error("Error updating referral:", error);
        return res.status(500).json(new ApiResponse(
            500,
            null,
            "Internal Server Error"
        ));
    }
});

