import StudentProfile from '../../models/studentProfile.model.js';
import { ApiResponse, asyncHandler } from '../../utils/index.js';

const maskAccount = (acct = '') => {
  if (!acct) return acct;
  const s = String(acct);
  const last4 = s.slice(-4);
  return '******' + last4;
};

export const getStudentDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by profile id first, then by user id
    let profile = await StudentProfile.findById(id)
      .populate('user', 'name email')
      .populate({
        path: 'paymentHistory',
        // populate fields if Payment model differs
      })
      .populate({
        path: 'tutions',
        // populate tutor/name fields if available
      })
      .populate({
        path: 'demoLessons'
      });

    if (!profile) {
      profile = await StudentProfile.findOne({ user: id })
        .populate('user', 'name email')
        .populate('paymentHistory')
        .populate('tutions')
        .populate('demoLessons');
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Map backend model to frontend mock shape
    const mapped = {
      id: profile._id,
      name: profile.user?.name || '',
      email: profile.user?.email || '',
      phone: profile.phone || '',
      // Try to derive subjects from tutions/demoLessons if present
      subjects: Array.isArray(profile.tutions) && profile.tutions.length
        ? profile.tutions.map(t => t.subject || t.title || t.name).filter(Boolean)
        : (Array.isArray(profile.demoLessons) && profile.demoLessons.length
            ? profile.demoLessons.map(d => d.subject || d.title || d.name).filter(Boolean)
            : []),
      assignedTutor: (Array.isArray(profile.tutions) && profile.tutions[0] && (profile.tutions[0].tutorName || (profile.tutions[0].tutor && profile.tutions[0].tutor.name)))
        || 'Unassigned',
      status: (profile.status || '').toString().toLowerCase(), // Active -> active
      coins: typeof profile.coins === 'number' ? profile.coins : (profile.walletBalance || 0),
      registrationDate: profile.createdAt ? new Date(profile.createdAt).toISOString().split('T')[0] : null,
      address: profile.address || '',
      bankDetails: {
        accountNumber: maskAccount(profile.bankDetails?.accountNumber),
        bankName: profile.bankDetails?.bankName || '',
        ifsc: profile.bankDetails?.ifscCode || profile.bankDetails?.ifsc || ''
      },
      documents: Array.isArray(profile.documents) ? profile.documents : [],
      // enrollments - try to map from tutions/demoLessons
      enrollments: Array.isArray(profile.tutions) && profile.tutions.length
        ? profile.tutions.map(t => ({
            course: t.title || t.course || t.name || 'Course',
            startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : (t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : null),
            status: (t.status || 'active').toString().toLowerCase()
          }))
        : (Array.isArray(profile.demoLessons) ? profile.demoLessons.map(d => ({
            course: d.title || d.name || 'Demo Lesson',
            startDate: d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : (d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : null),
            status: (d.status || 'active').toString().toLowerCase()
          })) : []),
      // payments - map to { id, amount, date, status }
      payments: Array.isArray(profile.paymentHistory) ? profile.paymentHistory.map(p => ({
        id: p._id || p.paymentId || '',
        amount: p.amount || 0,
        date: p.date ? new Date(p.date).toISOString().split('T')[0] : (p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : null),
        status: (p.status || 'completed').toString().toLowerCase()
      })) : [],
      referralCoins: typeof profile.referralCoins === 'number' ? profile.referralCoins : 0
    };

    return res.status(200).json({ success: true, data: mapped });
  } catch (err) {
    console.error('getStudentDetail error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

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
