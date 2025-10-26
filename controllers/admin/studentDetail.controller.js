import StudentProfile from '../../models/studentProfile.model.js';
import User from '../../models/user.model.js';
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

export const removeStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // validate id
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid student id!"));
  }

  try {
    const result = await StudentProfile.findByIdAndDelete(studentId);
    if (!result) {
      return res.status(404).json(new ApiResponse(404, null, "Student not found!"));
    }

    await User.findByIdAndUpdate(
      result.user,
      { role: 'USER' }
    );

    return res.status(200).json(new ApiResponse(200, null, "Student removed successfully!"));
  } catch (error) {
    console.error("Error removing student:", error.message || error);
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
          pipeline: [{ $project: { amount: 1, date: 1, status: 1, paymentId: 1, createdAt: 1 } }]
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

    // Add search filter if present
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

    // Add status filter if present
    if (status && status.toString().toLowerCase() !== 'all') {
      const statusRegex = new RegExp(`^${status}$`, 'i');
      pipeline.push({ $match: { status: statusRegex } });
    }

    // Sort by creation date
    pipeline.push({ $sort: { createdAt: -1, _id: 1 } });

    const [students, statsResults] = await Promise.all([
      // Main students query with pagination
      StudentProfile.aggregate([...pipeline, { $skip: skip }, { $limit: perPage }]),

      // Stats queries using Promise.all
      Promise.all([
        // Total matching documents count using the pipeline
        StudentProfile.aggregate([...pipeline, { $count: "total" }]),

        // Total students count
        StudentProfile.countDocuments(),

        // Active students count
        StudentProfile.countDocuments({
          status: { $regex: /^active$/i }
        }),

        // Pending verification count
        StudentProfile.countDocuments({
          status: { $regex: /^pending$/i }
        })
      ])
    ]);

    // Destructure stats results
    const [totalAgg, totalStudents, activeStudents, pendingVerification] = statsResults;

    // If totalAgg is empty, that means there were no matches
    const total = totalAgg.length > 0 ? totalAgg[0].total : 0;
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / perPage);

    // Map the students data
    const mappedStudents = students.map(profile => {
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
      {
        students: mappedStudents,
        totalPages,
        currentPage: pageNumber,
        stats: {
          totalStudents,
          total,
          activeStudents,
          pendingVerification
        }
      },
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
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json({ message: 'Student status updated successfully', student: updatedStudent });
  } catch (error) {
    console.error('updateStudentStatus error:', error);
    return res.status(500).json({ message: 'Failed to update student status' });
  }
});
