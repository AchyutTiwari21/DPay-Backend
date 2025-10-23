import StudentProfile from '../../models/studentProfile.model.js';
import { ApiResponse, asyncHandler } from '../../utils/index.js';
import mongoose from 'mongoose';

const maskAccount = (acct = '') => {
  if (!acct) return acct;
  const s = String(acct);
  const last4 = s.slice(-4);
  return '******' + last4;
};

export const getStudent = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // validate id
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid student id"));
  }

  try {
    const oid = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      // match by profile _id OR by referenced user id (handles routes that pass either)
      { $match: { $or: [{ _id: oid }, { user: oid }] } },

      // populate user basics
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { _id: 0, name: 1, email: 1 } }]
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // project desired fields
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

    const [student] = await StudentProfile.aggregate(pipeline);

    if (!student) {
      return res.status(404).json(new ApiResponse(404, null, "Student not found"));
    }

    return res.status(200).json(new ApiResponse(200, student, "Student retrieved successfully"));
  } catch (error) {
    console.error("Error retrieving student:", error.message || error);
    return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
  }
});

export const getStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status } = req.query;

  try {
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

      // populate tutions (enrollments)
      {
        $lookup: {
          from: 'tutions',
          localField: 'tutions',
          foreignField: '_id',
          as: 'tutions',
          pipeline: [
            {
              $lookup: {
                from: 'tutorprofiles', // Mongoose default collection name for TutorProfile
                localField: 'tutor',
                foreignField: '_id',
                as: 'tutorInfo',
                pipeline: [
                  {
                    $lookup: {
                      from: 'users',
                      localField: 'user',
                      foreignField: '_id',
                      as: 'tutorUserInfo'
                    }
                  },
                  { $unwind: { path: '$tutorUserInfo', preserveNullAndEmptyArrays: true } },
                  { $project: { name: '$tutorUserInfo.name' } }
                ]
              }
            },
            { $unwind: { path: '$tutorInfo', preserveNullAndEmptyArrays: true } },
            { $addFields: { tutorName: '$tutorInfo.name' } },
            { 
              $project: {
                title: 1,
                tutorName: 1,
                startDate: 1,
                endDate: 1,
                status: 1,
                createdAt: 1
              }
            }
          ]
        }
      },

      // populate paymentHistory
      {
        $lookup: {
          from: 'payments',
          localField: 'paymentHistory',
          foreignField: '_id',
          as: 'paymentHistory',
          pipeline: [{ $project: { amount: 1, paidAt: 1, status: 1, razorpay_payment_id: 1, createdAt: 1 } }]
        }
      },

      // project fields we'll need for matching / mapping
      {
        $project: {
          user: 1,
          phone: 1,
          address: 1,
          bankDetails: 1,
          documents: 1,
          coins: 1,
          walletBalance: 1,
          status: 1,
          createdAt: 1,
          tutions: 1,
          paymentHistory: 1
        }
      }
    ];

    // If search present, add a match after the lookup/unwind so we can search user fields too
    if (search) {
      const regex = new RegExp(search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'user.name': regex },
            { 'user.email': regex },
            { phone: regex },
            { address: regex }
          ]
        }
      });
    }

    // If status query provided and not 'all', filter by status (case-insensitive)
    if (status && status.toString().toLowerCase() !== 'all') {
      // Accept values like 'active'|'Active'|'pending' etc.
      const statusRegex = new RegExp(`^${status}$`, 'i');
      pipeline.push({ $match: { status: statusRegex } });
    }

    // default sort by createdAt desc (newest first)
    pipeline.push({ $sort: { createdAt: -1, _id: 1 } });

    // For counting total matching documents, clone pipeline and add $count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await StudentProfile.aggregate(countPipeline);
    const totalStudents = countResult[0]?.total ? Number(countResult[0].total) : 0;
    const totalPages = Math.ceil(totalStudents / perPage);

    // Aggregate status counts for matching set (Active / Pending)
    const statusPipeline = [...pipeline, {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }];

    const statusAgg = await StudentProfile.aggregate(statusPipeline);
    let activeStudents = 0;
    let pendingVerification = 0;
    statusAgg.forEach(s => {
      const key = (s._id || '').toString().toLowerCase();
      if (key === 'active') activeStudents = s.count;
      if (key === 'pending') pendingVerification = s.count;
    });

    // add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: perPage });

    // run aggregation to get page of profiles
    const profiles = await StudentProfile.aggregate(pipeline);
    
    // map results to frontend shape (matches mock at Student.jsx line ~46)
    const students = profiles.map(profile => {
      const statusVal = (profile.status || '').toString().toLowerCase();
      const enrollmentsSource = Array.isArray(profile.tutions) && profile.tutions.length ? profile.tutions : profile.demoLessons || [];

      const enrollments = (Array.isArray(enrollmentsSource) ? enrollmentsSource : []).map(e => ({
        course: e.title || e.course || e.name || 'Course',
        startDate: e.startDate ? new Date(e.startDate).toISOString().split('T')[0]
                  : (e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : null),
        status: (e.status || 'active').toString().toLowerCase()
      }));

      const payments = (Array.isArray(profile.paymentHistory) ? profile.paymentHistory : []).map(p => ({
        id: p.paymentId || p._id || '',
        amount: p.amount || 0,
        date: p.date ? new Date(p.date).toISOString().split('T')[0] : (p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : null),
        status: (p.status || 'completed').toString().toLowerCase()
      }));

      // subjects: attempt to derive from tutions/demoLessons if available (may be empty)
      const subjects = (Array.isArray(profile.tutions) && profile.tutions.length)
        ? profile.tutions.map(t => t.subject || t.title || t.course).filter(Boolean)
        : (Array.isArray(profile.demoLessons) ? profile.demoLessons.map(d => d.subject || d.title || d.name).filter(Boolean) : []);

      // assignedTutor: take tutorName or tutor.name if populated on tution
      let assignedTutor = 'Unassigned';
      if (Array.isArray(profile.tutions) && profile.tutions.length) {
        const first = profile.tutions[0];
        assignedTutor = first.tutorName || (first.tutor && first.tutor.name) || assignedTutor;
      }

      return {
        id: profile._id,
        name: profile.user?.name || '',
        email: profile.user?.email || '',
        phone: profile.phone || '',
        subjects,
        assignedTutor,
        status: statusVal || 'pending',
        coins: typeof profile.coins === 'number' ? profile.coins : (profile.walletBalance || 0),
        registrationDate: profile.createdAt ? new Date(profile.createdAt).toISOString().split('T')[0] : null,
        address: profile.address || '',
        bankDetails: {
          accountNumber: maskAccount(profile.bankDetails?.accountNumber),
          bankName: profile.bankDetails?.bankName || '',
          ifsc: profile.bankDetails?.ifscCode || profile.bankDetails?.ifsc || ''
        },
        documents: Array.isArray(profile.documents) ? profile.documents : [],
        enrollments,
        payments
      };
    });

    return res.status(200).json(new ApiResponse(
      true,
      { students, totalStudents, totalPages, currentPage: pageNumber, activeStudents, pendingVerification },
      'Students retrieved successfully'
    ));
  } catch (error) {
    console.error('getStudents error:', error);
    return res.status(500).json(new ApiResponse(false, null, 'Internal Server Error'));
  }
});

// New: returns labels and data arrays for student growth (last 12 months)
export const getStudentGrowth = asyncHandler(async (req, res) => {
  try {
    // Helper to get short month name
    const getMonthShortName = (monthIndex) => [
      'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
    ][monthIndex];

    const now = new Date();
    const labels = [];
    const data = [];

    // last 12 months, oldest first
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const count = await StudentProfile.countDocuments({
        createdAt: { $gte: date, $lt: nextMonth }
      });

      labels.push(getMonthShortName(date.getMonth()));
      data.push(count);
    }

    return res.status(200).json({ labels, data });
  } catch (err) {
    console.error('getStudentGrowth error:', err);
    return res.status(500).json({ error: 'Failed to fetch student growth data' });
  }
});

export const updateStudentStatus = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { status } = req.body;

  // Validate status
  if (!status || !['active', 'inactive', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const updatedStudent = await StudentProfile.findByIdAndUpdate(studentId, { status }, { new: true });
    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    return res.status(200).json({ message: 'Student status updated successfully', student: updatedStudent });
  } catch (error) {
    console.error('updateStudentStatus error:', error);
    return res.status(500).json({ error: 'Failed to update student status' });
  }
});
