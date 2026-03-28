import { asyncHandler, ApiResponse } from "../../utils/index.js";
import { Payment } from "../../models/index.js";

export const getPayments = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10,
        search,
        type,
        status,
        role,
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
            pipeline.push({ $match: { date: dateFilter } });
        }

        // Basic match stage
        let matchStage = {};
        if (type) matchStage.type = type;
        if (status) matchStage.status = status.toUpperCase();
        if (Object.keys(matchStage).length) {
            pipeline.push({ $match: matchStage });
        }

        // Lookup stages
        pipeline.push(
            // Lookup payer details
            {
                $lookup: {
                    from: "users",
                    localField: "payer",
                    foreignField: "_id",
                    as: "payerDetails",
                    pipeline: [
                        { $project: { name: 1, role: 1, email: 1, phone: 1 } }
                    ]
                }
            },
            { $unwind: "$payerDetails" }
        );

        // Search filter
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { "payerDetails.name": { $regex: search, $options: "i" } },
                        { "method": { $regex: search, $options: "i" } },
                        { "type": { $regex: search, $options: "i" } }
                    ]
                }
            });
        }

        // Role filter
        if (role) {
            pipeline.push({
                $match: {
                    "payerDetails.role": role
                }
            });
        }

        // Add related data based on payment type
        pipeline.push({
            $lookup: {
                from: "lessons",
                localField: "lesson",
                foreignField: "_id",
                as: "bookingDetails",
                pipeline: [
                    // populate subject
                    {
                        $lookup: {
                            from: "subjects",
                            localField: "subject",
                            foreignField: "_id",
                            as: "subject",
                            pipeline: [{ $project: { name: 1 } }]
                        }
                    },
                    { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },

                    // populate tutor -> user (to get tutor name)
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
                                        pipeline: [{ $project: { name: 1 } }]
                                    }
                                },
                                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                                { $project: { fullName: "$user.name" } }
                            ]
                        }
                    },
                    { $unwind: { path: "$tutor", preserveNullAndEmptyArrays: true } },

                    // project the fields you will use later
                    { $project: { _id: 1, date: 1, subjectName: "$subject.name", tutorName: "$tutor.fullName" } }
                ]
            }
        });

        // Add sort to the pipeline before the final $project (so you sort by actual Date value)
        pipeline.push({ $sort: { date: -1 } });

        // Format output
        pipeline.push({
            $project: {
                id: "$_id",
                paymentId: 1,
                payerName: "$payerDetails.name",
                payerEmail: "$payerDetails.email",
                payerPhone: "$payerDetails.phone",
                role: "$payerDetails.role",
                amount: 1,
                currency: 1,
                paymentType: "$type",
                status: 1,
                method: 1,
                date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                booking: {
                    $cond: {
                        if: { $eq: ["$type", "Demo Class Payment"] },
                        then: {
                            bookingId: { $arrayElemAt: ["$bookingDetails._id", 0] },
                            subject: { $arrayElemAt: ["$bookingDetails.subjectName", 0] },
                            sessionDate: {
                                $dateToString: {
                                    format: "%Y-%m-%d",
                                    date: { $arrayElemAt: ["$bookingDetails.date", 0] }
                                }
                            },
                            tutor: { $arrayElemAt: ["$bookingDetails.tutorName", 0] }
                        },
                        else: "$$REMOVE"
                    }
                },
                registration: {
                    $cond: {
                        if: { $eq: ["$type", "Registration Fee"] },
                        then: {
                            tutorId: "$payer",
                            plan: "$plan"
                        },
                        else: "$$REMOVE"
                    }
                },
                payout: {
                    $cond: {
                        if: { $eq: ["$type", "Tutor Payout"] },
                        then: {
                            payoutId: "$_id",
                            bankRef: "$bankReference"
                        },
                        else: "$$REMOVE"
                    }
                },
            }
        });

        // Execute aggregation with pagination
        const [payments, statsResults] = await Promise.all([
            // Main payments query (no need to re-add sort here)
            Payment.aggregate([...pipeline, { $skip: skip }, { $limit: perPage }]),

            // Stats queries
            Promise.all([
                // Total filtered count
                Payment.aggregate([...pipeline, { $count: "total" }]),

                // Total revenue from paid bookings and registration
                Payment.aggregate([
                    { $match: { 
                        status: "PAID"
                    }},
                    { $group: { _id: null, total: { $sum: "$amount" } }}
                ]),

                // Demo Class Payments
                Payment.aggregate([
                    { $match: { 
                        type: "Demo Class Payment",
                        status: "PAID"
                    }},
                    { $group: { _id: null, total: { $sum: "$amount" } }}
                ]),

                // Completed payouts
                Payment.aggregate([
                    { $match: { 
                        type: "Tutor Payout",
                        status: "PAID"
                    }},
                    { $group: { _id: null, total: { $sum: "$amount" } }}
                ]),

                // Registration fees
                Payment.aggregate([
                    { $match: { 
                        type: "Registration Payment",
                        status: "PAID"
                    }},
                    { $group: { _id: null, total: { $sum: "$amount" } }}
                ])
            ])
        ]);

        // Process stats results
        const [totalAgg, revenue, demoClassPayment, completedPayouts, regFees] = statsResults;
        const total = totalAgg.length > 0 ? totalAgg[0].total : 0;
        const totalPages = Math.ceil(total / perPage);

        // Format the response
        return res.status(200).json(new ApiResponse(
            200,
            {
                payments,
                pagination: {
                    total,
                    totalPages,
                    currentPage: pageNumber,
                    perPage
                },
                stats: {
                    totalRevenue: revenue[0]?.total || 0,
                    demoClassPayment: demoClassPayment[0]?.total || 0,
                    completedPayouts: completedPayouts[0]?.total || 0,
                    regFees: regFees[0]?.total || 0
                }
            },
            "Payments retrieved successfully"
        ));

    } catch (error) {
        console.error("Error retrieving payments:", error);
        return res.status(500).json(new ApiResponse(
            500,
            null,
            "Internal Server Error"
        ));
    }
});

export const removePayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json(new ApiResponse(
                404,
                null,
                "Payment not found!"
            ));
        }

        if (payment.status === "PAID" || payment.status === "PENDING") {
            return res.status(400).json(new ApiResponse(
                400,
                null,
                "Paid or pending payments cannot be removed!"
            ));
        }

        await Payment.findByIdAndDelete(id);
        return res.status(200).json(new ApiResponse(
            200,
            null,
            "Payment removed successfully!"
        ));
    } catch (error) {
        console.error("Error removing payment:", error);
        return res.status(500).json(new ApiResponse(
            500,
            null,
            "Internal Server Error"
        ));
    }
});
