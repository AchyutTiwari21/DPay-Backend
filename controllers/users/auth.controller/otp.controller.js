import otpGenerator from 'otp-generator';
import { OTP, User } from '../../../models/index.js';
import { asyncHandler, ApiResponse } from '../../../utils/index.js';
import { generateAccessAndRefreshTokens } from '../../../utils/index.js';
import { cookieOptions } from '../../../constants.js';

export const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {

    // Check if user is already present
    const checkUserPresent = await User.findOne({ email });
    
    // If user found with provided email
    if (checkUserPresent) {
      return res.status(401).json(
        new ApiResponse(
          401,
          null,
          'User is already registered with this email.'
        )
      );
    }

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    let result = await OTP.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }
    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "OTP sent successfully"
      )
    );
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        'Internal Server Error'
      )
    );
  }
});

export const sendRefreshOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {

    // Check if user is already present
    const checkUserPresent = await User.findOne({ email });
    
    // If user found with provided email
    if (!checkUserPresent) {
      return res.status(401).json(
        new ApiResponse(
          401,
          null,
          'User is not registered. Sign up to continue.'
        )
      );
    }

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    let result = await OTP.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }
    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "OTP sent successfully"
      )
    );
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        'Internal Server Error'
      )
    );
  }
});

export const checkOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  try {
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

    const user = await User.findOne({ email });

    if(!user) {
      return res.status(404).json(
        new ApiResponse(
          404,
          null,
          'User not registered. Signup to Continue.'
        )
      );
    }

    const { accessToken } = await generateAccessAndRefreshTokens(user._id);

    // If OTP is valid, proceed with your logic (e.g., mark it as used)
    await OTP.deleteOne({ _id: response[0]._id });

    return res
    .status(200)
    .cookie("accessToken", accessToken, { 
      ...cookieOptions, 
      maxAge: 15 * 60 * 1000 // 15 minutes
    })
    .json(
      new ApiResponse(
        200,
        { accessToken },
        'OTP verified successfully'
      )
    );
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        'Internal Server Error'
      )
    );
  }
});
