import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Address from '../../../models/Address.model.js';

// GET /api/user/addresses
export const getAddresses = asyncHandler(async (req, res) => {
    const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1 });
    res.status(200).json(new ApiResponse(200, addresses, 'Addresses fetched.'));
});

// POST /api/user/addresses
export const addAddress = asyncHandler(async (req, res) => {
    const { name, fullName, phone, address, city, state, zipCode, country, isDefault } = req.body;

    // If new address is default, unset all others
    if (isDefault) {
        await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }

    const newAddress = await Address.create({ userId: req.user.id, name, fullName, phone, address, city, state, zipCode, country, isDefault: isDefault || false });
    res.status(201).json(new ApiResponse(201, newAddress, 'Address added.'));
});

// PUT /api/user/addresses/:id
export const updateAddress = asyncHandler(async (req, res) => {
    const addr = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    if (!addr) throw new ApiError(404, 'Address not found.');

    if (req.body.isDefault) {
        await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }

    Object.assign(addr, req.body);
    await addr.save();
    res.status(200).json(new ApiResponse(200, addr, 'Address updated.'));
});

// DELETE /api/user/addresses/:id
export const deleteAddress = asyncHandler(async (req, res) => {
    const addr = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!addr) throw new ApiError(404, 'Address not found.');
    res.status(200).json(new ApiResponse(200, null, 'Address deleted.'));
});

// PATCH /api/user/addresses/:id/default
export const setDefaultAddress = asyncHandler(async (req, res) => {
    await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    const addr = await Address.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { isDefault: true }, { new: true });
    if (!addr) throw new ApiError(404, 'Address not found.');
    res.status(200).json(new ApiResponse(200, addr, 'Default address updated.'));
});
