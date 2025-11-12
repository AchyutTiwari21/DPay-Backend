import { ApplyTeacherRequest, TutorProfile, User, Notification } from "../../models/index.js";
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
                    pipeline: [{ $project: { name: 1, category: 1 } } ]
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

        // Run main query (with sort + pagination) and stats in parallel
        const [requests, statsResults] = await Promise.all([
            // Main aggregate with pagination
            ApplyTeacherRequest.aggregate([
                ...pipeline,
                { $sort: { createdAt: -1, _id: 1 } },
                { $skip: skip },
                { $limit: perPage }
            ]),

            // Stats: total matching (for pagination) + global counts
            Promise.all([
                // total matching documents count using the same pipeline (before pagination)
                ApplyTeacherRequest.aggregate([...pipeline, { $count: "total" }]),

                // total requests (all documents)
                ApplyTeacherRequest.countDocuments(),

                // pending requests
                ApplyTeacherRequest.countDocuments({ status: "PENDING" }),

                // accepted requests
                ApplyTeacherRequest.countDocuments({ status: "ACCEPTED" }),

                // rejected requests
                ApplyTeacherRequest.countDocuments({ status: "REJECTED" })
            ])
        ]);

        // Destructure stats results
        const [totalAgg, totalRequests, pendingRequests, acceptedRequests, rejectedRequests] = statsResults;

        // If totalAgg is empty, that means there were no matches for the pipeline
        const total = totalAgg.length > 0 ? totalAgg[0].total : 0;

        const totalPages = Math.max(0, Math.ceil(total / perPage));

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    requests,
                    totalRequests,
                    total, // number matching current filters (used for pagination)
                    pendingRequests,
                    acceptedRequests,
                    rejectedRequests,
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
            const tutorProfile = await TutorProfile.create({
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

            const notification = await Notification.create({
                user: updatedRequest.user._id,
                title: "Application Accepted",
                message: "Congratulations! Your application to become a tutor has been accepted. Pay the required fees to activate your tutor profile.",
                type: "payment-request",
            });

            tutorProfile.notifications.push(notification._id);
            await tutorProfile.save();

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
