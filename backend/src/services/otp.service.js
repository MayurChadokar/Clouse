import crypto from 'crypto';
import { sendEmail } from './email.service.js';

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

    try {
        await sendEmail({
            to: user.email,
            subject: 'Your verification code',
            text: `Your verification code is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        });
    } catch (err) {
        // Keep auth flow working in environments where SMTP is not configured.
        console.warn(`[OTP] Email send failed for ${user.email}: ${err.message}`);
        console.log(`[OTP] ${type} OTP for ${user.email}: ${otp}`);
    }

    return otp;
};
