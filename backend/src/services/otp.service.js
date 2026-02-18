import crypto from 'crypto';

/**
 * Generates a 6-digit OTP and sets expiry (10 minutes)
 * @param {Object} user - Mongoose user/vendor document
 * @param {string} type - Purpose label (for logging)
 */
export const sendOTP = async (user, type = 'verification') => {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    // TODO: Integrate with email.service.js to send actual email
    // await sendEmail({ to: user.email, subject: 'Your OTP', text: `Your OTP is: ${otp}` });

    console.log(`[OTP] ${type} OTP for ${user.email}: ${otp}`); // Remove in production
    return otp;
};
