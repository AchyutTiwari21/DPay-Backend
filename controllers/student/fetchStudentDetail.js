import { StudentProfile } from "../../models/index.js";
import { asyncHandler, ApiResponse } from '../../utils/index.js';

export const fetchStudentDetail = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json(
        new ApiResponse(401, null, 'Unauthorized')
    );

    const studentProfile = await StudentProfile.findOne({ user: userId })
      .populate({
        path: 'notifications',
        options: { sort: { createdAt: -1 } }
      })
      .select('_id walletBalance status notifications marks');
    
    if (!studentProfile) {
        return res.status(404).json(
            new ApiResponse(404, null, 'Student profile not found')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, studentProfile, 'Student profile fetched successfully')
    );
  } catch (error) {
    console.error('Error fetching student details:', error);
    return res.status(500).json(
        new ApiResponse(500, null, 'Internal Server Error')
    );
  }
});
