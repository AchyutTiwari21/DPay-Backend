import { ApplyTeacherRequest, TutorProfile, User } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";
import { mailSender } from "../../utils/mailSender.js";

export const getAllTeacherRequests = asyncHandler(async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            subjects
        } = req.query;

        const pageNumber = Number(page) || 1;
        const perPage = Number(limit) || 10;
        const skip = (pageNumber - 1) * perPage;

        const pipeline = [
            // populate user details
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [{ $project: { name: 1, email: 1, _id: 1 } }]
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

            // populate subjects
            {
                $lookup: {
                    from: 'subjects',
                    localField: 'subjects',
                    foreignField: '_id',
                    as: 'subjects',
                    pipeline: [{ $project: { name: 1, category: 1 } }]
                }
            },

            // project needed fields
            {
                $project: {
                    user: 1,
                    address: 1,
                    phone: 1,
                    subjects: 1,
                    status: 1,
                    createdAt: 1,
                    experience: 1,
                    qualifications: 1,
                    resume: 1,
                    demoVideo: 1
                }
            }
        ];

        // search functionality
        if (search) {
            const regex = new RegExp(search, 'i');
            pipeline.push({
                $match: {
                    $or: [
                        { 'user.name': regex },
                        { 'user.email': regex },
                        { 'subjects.name': regex },
                        { 'subjects.category': regex },
                        { 'address': regex },
                        { 'phone': regex },
                        { 'experience': regex },
                        { 'qualifications': regex }
                    ]
                }
            });
        }

        // status filter
        if (status && String(status).toLowerCase() !== 'all') {
            const statuses = String(status).split(',').map(s => s.trim()).filter(Boolean);
            pipeline.push({
                $match: {
                    status: { $in: statuses }
                }
            });
        }

        // subjects filter
        if (subjects) {
            const subjList = String(subjects).split(',').map(s => s.trim()).filter(Boolean);
            pipeline.push({
                $match: {
                    'subjects.name': { $in: subjList }
                }
            });
        }

        // Get total count before pagination
        const countPipeline = [...pipeline];
        const countResult = await ApplyTeacherRequest.aggregate(countPipeline);
        const totalRequests = countResult.length;
        const totalPages = Math.ceil(totalRequests / perPage);

        // Get counts for different statuses
        const statusCounts = await ApplyTeacherRequest.aggregate([
            ...pipeline.slice(0, -3), // Remove sort, skip and limit
            {
                $group: {
                    _id: null,
                    totalRequests: { $sum: 1 },
                    pendingRequests: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0]
                        }
                    },
                    acceptedRequests: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "ACCEPTED"] }, 1, 0]
                        }
                    },
                    rejectedRequests: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const counts = statusCounts[0] || {
            totalRequests: 0,
            pendingRequests: 0,
            acceptedRequests: 0,
            rejectedRequests: 0
        };

        // Add sorting and pagination
        pipeline.push(
            { $sort: { createdAt: -1, _id: 1 } },
            { $skip: skip },
            { $limit: perPage }
        );

        const requests = await ApplyTeacherRequest.aggregate(pipeline);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    requests,
                    totalRequests: counts.totalRequests,
                    pendingRequests: counts.pendingRequests,
                    acceptedRequests: counts.acceptedRequests,
                    rejectedRequests: counts.rejectedRequests,
                    totalPages,
                    currentPage: pageNumber
                },
                "Tutor requests retrieved successfully."
            )
        );
    } catch (error) {
        console.error("Error retrieving tutor requests:", error);
        return res.status(500).json(
            new ApiResponse(500, null, "Error retrieving tutor requests")
        );
    }
});

export const updateTeacherRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updatedRequest = await ApplyTeacherRequest.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate("user", "name email profileImg");

        if (!updatedRequest) {
            return res.status(404).json(
                new ApiResponse(false, null, "Teacher request not found")
            );
        }
        
        let message = "";

        if(status == "ACCEPTED") {
            await TutorProfile.create({
                user: updatedRequest.user._id,
                address: updatedRequest.address,
                phone: updatedRequest.phone,
                subjects: updatedRequest.subjects,
                experience: updatedRequest.experience,
                education: updatedRequest.qualifications,
            });

            const user = await User.findByIdAndUpdate(updatedRequest.user._id, { $set: { role: "TUTOR" } });

            await mailSender(user.email, "Congratulations! Your application has been accepted", `
                <p>Dear ${user.name},</p>
                <p>Congratulations! Your application to become a tutor has been accepted.</p>
                <p>We are excited to have you on board.</p>
            `);

            message = "Teacher request accepted and Tutor Profile created.";
        } else if(status == "REJECTED") {
            await mailSender(updatedRequest.user.email, "Application Update", `
                <p>Dear ${updatedRequest.user.name},</p>
                <p>We regret to inform you that your application to become a tutor has been rejected.</p>
                <p>Thank you for your interest, and we encourage you to apply again in the future.</p>
            `);

            message = "Teacher request rejected.";
        }

        return res.status(200).json(
            new ApiResponse(200, null, message)
        );
    } catch (error) {
        console.log("Error updating teacher request:", error.message);

        return res.status(500).json(new ApiResponse(500, null, "Error updating teacher request", error.message));
    }
});

export const removeTeacherRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const deletedRequest = await ApplyTeacherRequest.findByIdAndDelete(id);
        if (!deletedRequest) {
            return res.status(404).json(
                new ApiResponse(false, null, "Teacher request not found")
            );
        }
        return res.status(200).json(
            new ApiResponse(true, null, "Teacher request deleted successfully")
        );
    } catch (error) {
        console.log("Error deleting teacher request:", error.message);
        return res.status(500).json(
            new ApiResponse(false, null, "Error deleting teacher request", error.message)
        );
    }
});
