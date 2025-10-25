import { TutorProfile, User, Subject, Availability } from "../../models/index.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";
import { mailSender } from "../../utils/mailSender.js";
import mongoose from "mongoose";

export const addTutor = asyncHandler(async (req, res) => {
    const { email } = req.body;

    try {
        const userRecord = await User.findOne({
            email
        })

        if(!userRecord) {
            return res.status(404).json(new ApiResponse(
                false,
                null,
                "User not registered."
            ));
        }

        await TutorProfile.create({
            user: userRecord._id,
        });

        const user = await User.findByIdAndUpdate(userRecord._id, { $set: { role: "TUTOR" } });

        await mailSender(user.email, "Congratulations! You are now a tutor", `
            <p>Dear ${user.name},</p>
            <p>Congratulations! You have been successfully added as a tutor.</p>
            <p>We are excited to have you on board.</p>
        `);

        return res.status(201).json(
            new ApiResponse(201, null, "Tutor added successfully")
        );
    } catch (error) {
        console.log("Error adding tutor:", error.message);

        return res.status(500).json(new ApiResponse(500, null, "Error adding tutor", error.message));
    }
});

export const getTutors = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,         // e.g. "Active" or "Active,Pending"
      paymentStatus,  // e.g. "Paid" or "Paid,Pending"
      subjects,       // e.g. "Math,Physics"
      isVerified      // "true" | "false"
    } = req.query;

    const pageNumber = Number(page) || 1;
    const perPage = Number(limit) || 10;
    const skip = (pageNumber - 1) * perPage;

    const pipeline = [
      // populate user basics
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

      // populate subjects (get subject names)
      {
        $lookup: {
          from: 'subjects',
          localField: 'subjects',
          foreignField: '_id',
          as: 'subjects',
          pipeline: [{ $project: { name: 1, category: 1 } }]
        }
      },

      // populate paymentHistory
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentHistory',
          foreignField: '_id',
          as: 'paymentHistory',
          pipeline: [{ $project: { amount: 1, paidAt: 1, status: 1, razorpay_payment_id: 1, createdAt: 1, paymentId: 1 } }]
        }
      },

      // project fields we'll use
      {
        $project: {
          user: 1,
          phone: 1,
          address: 1,
          experience: 1,
          rating: 1,
          verified: 1,
          registrationDate: 1,
          registrationFees: 1,
          paymentStatus: 1,
          paymentHistory: 1,
          subjects: 1,
          createdAt: 1,
          status: 1
        }
      }
    ];

    // search support (name/email/phone/subject name/address)
    if (search) {
      const regex = new RegExp(search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'user.name': regex },
            { 'user.email': regex },
            { phone: regex },
            { address: regex },
            { 'subjects.name': regex },
            { 'subjects.category': regex }
          ]
        }
      });
    }

    // Build filter match from query params
    const filterMatch = {};

    if (status && String(status).toLowerCase() !== 'all') {
      const statuses = String(status).split(',').map(s => s.trim()).filter(Boolean);
      filterMatch.status = { $in: statuses }; // Ensure we match any of the statuses
    }

    if (paymentStatus && String(paymentStatus).toLowerCase() !== 'all') {
      const payments = String(paymentStatus).split(',').map(s => s.trim()).filter(Boolean);
      filterMatch.paymentStatus = { $in: payments }; // Ensure we match any of the payment statuses
    }

    if (subjects) {
      const subjList = String(subjects).split(',').map(s => s.trim()).filter(Boolean);
      filterMatch['subjects.name'] = { $in: subjList }; // Match any of the subject names
    }

    if (typeof isVerified !== 'undefined' && isVerified !== '') {
      const val = String(isVerified).toLowerCase();
      if (val === 'true' || val === '1') filterMatch.verified = true;
      else if (val === 'false' || val === '0') filterMatch.verified = false;
    }

    // apply filters if any
    if (Object.keys(filterMatch).length > 0) {
      pipeline.push({ $match: filterMatch });
    }

    const [tutors, statsResults] = await Promise.all([
      // Main tutors query with pagination
      TutorProfile.aggregate([...pipeline, { $skip: skip }, { $limit: perPage }]),

      // Stats queries using Promise.all
      Promise.all([
        // Total matching documents count using the pipeline
        TutorProfile.aggregate([...pipeline, { $count: "total" }]),

        // Total tutors count
        TutorProfile.countDocuments(),

        // Active tutors count
        TutorProfile.countDocuments({
          status: 'Active'
        }),

        // Pending verification count
        TutorProfile.countDocuments({
          verified: false
        }),

        // Top rated tutors count
        TutorProfile.countDocuments({
          rating: { $gte: 4.5 }
        })
      ])
    ]);

    // Destructure stats results
    const [totalAgg, totalTutors, activeTutors, pendingTutors, topRatedTutors] = statsResults;

    // If totalAgg is empty, that means there were no matches
    const total = totalAgg.length > 0 ? totalAgg[0].total : 0;
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / perPage);

    // map to frontend mock shape used in Tutor.jsx
    const mappedTutors = tutors.map(p => {
      return {
        id: p._id,
        name: p.user?.name || '',
        email: p.user?.email || '',
        phone: p.phone || '',
        subjects: Array.isArray(p.subjects) ? p.subjects.map(s => s.name || String(s)) : [],
        experience: Number(p.experience) || 0,
        location: p.address || '',
        rating: (typeof p.rating !== 'undefined') ? String(Number(p.rating).toFixed(1)) : '5.0',
        status: p.status,
        paymentStatus: p.paymentStatus || 'Pending',
        isVerified: !!p.verified,
        registrationDate: p.registrationDate
          ? new Date(p.registrationDate).toISOString().split('T')[0]
          : (p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : null),
        registrationFee: p.registrationFees || 0,
        paymentHistory: Array.isArray(p.paymentHistory) ? p.paymentHistory.map(pay => ({
          id: pay.paymentId || pay._id || '',
          date: pay.paidAt ? new Date(pay.paidAt).toISOString().split('T')[0] : (pay.createdAt ? new Date(pay.createdAt).toISOString().split('T')[0] : null),
          amount: pay.amount || 0,
          status: pay.status || '',
          transactionId: pay.razorpay_payment_id || ''
        })) : []
      };
    });

    return res.status(200).json(new ApiResponse(
      200,
      {
        tutors: mappedTutors,
        totalPages,
        currentPage: pageNumber,
        stats: {
          totalTutors,
          total,
          activeTutors,
          pendingTutors,
          topRatedTutors
        }
      },
      'Tutors retrieved successfully'
    ));
  } catch (err) {
    console.error('getTutors error:', err);
    return res.status(500).json(new ApiResponse(500, null, 'Internal Server Error'));
  }
});

export const getTutor = asyncHandler(async (req, res) => {
    const { tutorId } = req.params;
    try {
        const pipeline = [
            // Match the specific tutor with new keyword
            { $match: { _id: new mongoose.Types.ObjectId(tutorId) } },

            // Same lookups as getTutors
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                    pipeline: [
                        { $project: { _id: 0, name: 1, email: 1 } }
                    ]
                }
            },
            { $unwind: "$user" },
            // Project fields in the same format
            {
                $project: {
                    _id: 1,
                    name: "$user.name",
                    email: "$user.email",
                    phone: 1,
                    address: 1
                }
            }
        ];

        const [tutor] = await TutorProfile.aggregate(pipeline);

        if (!tutor) {
            return res.status(404).json(new ApiResponse(404, null, "Tutor not found"));
        }

        return res.status(200).json(new ApiResponse(
            200,
            tutor,
            "Tutor retrieved successfully"
        ));
    } catch (error) {
        console.error("Error retrieving tutor:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});

export const removeTutor = asyncHandler(async (req, res) => {
    const { tutorId } = req.params;

    try {
        await Availability.deleteMany({ tutor: tutorId });
        const tutor = await TutorProfile.findById(tutorId);

        if (!tutor) {
            return res.status(404).json(new ApiResponse(false, null, "Tutor not found!"));
        }

        await TutorProfile.findByIdAndDelete(tutorId);
        const user = await User.findByIdAndUpdate(tutor.user, { $set: { role: "USER" } });

        await mailSender(user.email, "You have been removed as a tutor", `
            <p>Dear ${user.name},</p>
            <p>You have been removed as a tutor.</p>
        `);

        return res.status(200).json(new ApiResponse(200, null, "Tutor removed successfully!"));
    } catch (error) {
        console.error("Error removing tutor:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});

export const verifyTutor = asyncHandler(async (req, res) => {
    const { tutorId } = req.params;

    try {
        const tutor = await TutorProfile.findByIdAndUpdate(
            tutorId,
            { verified: true, status: "Active" },
            { new: true }
        );

        if (!tutor) {
            return res.status(404).json(new ApiResponse(false, null, "Tutor not found"));
        }

        return res.status(200).json(new ApiResponse(200, null, "Tutor verified successfully"));
    } catch (error) {
        console.error("Error verifying tutor:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});

export const addSubject = asyncHandler(async (req, res) => {
    const { name, category } = req.body;

    try {
        await Subject.create({ name, category });
        return res.status(201).json(
            new ApiResponse(201, null, "Subject added successfully")
        );
    } catch (error) {
        console.error("Error adding subject:", error.message);
        return res.status(500).json(
            new ApiResponse(500, null, "Internal Server Error")
        );
    }
});

export const removeSubject = asyncHandler(async (req, res) => {
    const { subjectId } = req.params;

    try {
        const subject = await Subject.findByIdAndDelete(subjectId);

        if (!subject) {
            return res.status(404).json(new ApiResponse(false, null, "Subject not found"));
        }

        return res.status(200).json(new ApiResponse(200, null, "Subject removed successfully"));
    } catch (error) {
        console.error("Error removing subject:", error.message);
        return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
});
