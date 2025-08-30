import { User, OTP } from "../../../models/index.js";
import { asyncHandler, ApiResponse } from "../../../utils/index.js";

export const registerUser = asyncHandler(async (req, res) => {
    console.log('Request reached! ', req.body);

    const { name, email, password, otp }  = req.body;

    try {

      // Check if user already exists
      const existingUser = await User.findOne({
          email
      });
      if (existingUser) {
        return res.status(400).json(
          new ApiResponse(
            400,
            null,
            'User already exists'
          )
        );
      }

      // Find the most recent OTP for the email
      const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
      if (response.length === 0 || otp !== response[0].otp) {
        return res.status(400).json(
          new ApiResponse(
            400,
            null,
            'The OTP is not valid.'
          )
        );
      }

      await User.create({
        name,
        email,
        password
      });

      return res.status(201).json(
        new ApiResponse(
          201,
          null,
          "User registered successfully"
        )
      );
    } catch(e) {
      return res.status(500).json(
        new ApiResponse(
          500,
          null,
          'Error while signing up!'
        )
      );
    }
});