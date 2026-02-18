import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import DeliveryBoy from '../../../models/DeliveryBoy.model.js';
import { generateTokens } from '../../../utils/generateToken.js';

// POST /api/delivery/auth/login
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const deliveryBoy = await DeliveryBoy.findOne({ email }).select('+password');
    if (!deliveryBoy) throw new ApiError(401, 'Invalid credentials.');
    if (!deliveryBoy.isActive) throw new ApiError(403, 'Account is deactivated. Contact admin.');

    const isMatch = await deliveryBoy.comparePassword(password);
    if (!isMatch) throw new ApiError(401, 'Invalid credentials.');

    const { accessToken, refreshToken } = generateTokens({ id: deliveryBoy._id, role: 'delivery', email: deliveryBoy.email });
    res.status(200).json(new ApiResponse(200, { accessToken, refreshToken, deliveryBoy: { id: deliveryBoy._id, name: deliveryBoy.name, phone: deliveryBoy.phone, isAvailable: deliveryBoy.isAvailable } }, 'Login successful.'));
});

// GET /api/delivery/auth/profile
export const getProfile = asyncHandler(async (req, res) => {
    const deliveryBoy = await DeliveryBoy.findById(req.user.id);
    if (!deliveryBoy) throw new ApiError(404, 'Delivery boy not found.');
    res.status(200).json(new ApiResponse(200, deliveryBoy, 'Profile fetched.'));
});

// PUT /api/delivery/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
    const { name, phone, isAvailable, currentLocation } = req.body;
    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(req.user.id, { name, phone, isAvailable, currentLocation }, { new: true });
    res.status(200).json(new ApiResponse(200, deliveryBoy, 'Profile updated.'));
});
