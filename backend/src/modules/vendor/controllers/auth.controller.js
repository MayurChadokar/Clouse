import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Vendor from '../../../models/Vendor.model.js';
import { generateTokens } from '../../../utils/generateToken.js';
import { sendOTP } from '../../../services/otp.service.js';

// POST /api/vendor/auth/register
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, phone, storeName, storeDescription } = req.body;

    const existing = await Vendor.findOne({ email });
    if (existing) throw new ApiError(409, 'Email already registered.');

    const vendor = await Vendor.create({ name, email, password, phone, storeName, storeDescription, status: 'pending' });
    await sendOTP(vendor, 'vendor_verification');

    res.status(201).json(new ApiResponse(201, { email: vendor.email }, 'Registration submitted. Please verify your email and await admin approval.'));
});

// POST /api/vendor/auth/verify-otp
export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const vendor = await Vendor.findOne({ email }).select('+otp +otpExpiry');
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    if (vendor.otp !== otp) throw new ApiError(400, 'Invalid OTP.');
    if (vendor.otpExpiry < Date.now()) throw new ApiError(400, 'OTP has expired.');

    vendor.isVerified = true;
    vendor.otp = undefined;
    vendor.otpExpiry = undefined;
    await vendor.save();

    res.status(200).json(new ApiResponse(200, null, 'Email verified. Awaiting admin approval.'));
});

// POST /api/vendor/auth/login
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const vendor = await Vendor.findOne({ email }).select('+password');
    if (!vendor) throw new ApiError(401, 'Invalid credentials.');
    if (!vendor.isVerified) throw new ApiError(403, 'Please verify your email first.');
    if (vendor.status === 'pending') throw new ApiError(403, 'Your account is pending admin approval.');
    if (vendor.status === 'suspended') throw new ApiError(403, `Your account has been suspended. Reason: ${vendor.suspensionReason || 'Contact support.'}`);
    if (vendor.status === 'rejected') throw new ApiError(403, 'Your vendor application was rejected.');

    const isMatch = await vendor.comparePassword(password);
    if (!isMatch) throw new ApiError(401, 'Invalid credentials.');

    const { accessToken, refreshToken } = generateTokens({ id: vendor._id, role: 'vendor', email: vendor.email });
    res.status(200).json(new ApiResponse(200, { accessToken, refreshToken, vendor: { id: vendor._id, name: vendor.name, storeName: vendor.storeName, email: vendor.email, storeLogo: vendor.storeLogo } }, 'Login successful.'));
});

// GET /api/vendor/auth/profile
export const getProfile = asyncHandler(async (req, res) => {
    const vendor = await Vendor.findById(req.user.id).select('-password -otp -otpExpiry');
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    res.status(200).json(new ApiResponse(200, vendor, 'Profile fetched.'));
});

// PUT /api/vendor/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
    const allowed = ['name', 'phone', 'storeName', 'storeDescription', 'address'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const vendor = await Vendor.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password -otp -otpExpiry');
    res.status(200).json(new ApiResponse(200, vendor, 'Profile updated.'));
});
