import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Wishlist from '../../../models/Wishlist.model.js';

// GET /api/user/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
    const wishlist = await Wishlist.findOne({ userId: req.user.id }).populate('items.productId', 'name price image stock');
    res.status(200).json(new ApiResponse(200, wishlist?.items || [], 'Wishlist fetched.'));
});

// POST /api/user/wishlist
export const addToWishlist = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ userId: req.user.id });

    if (!wishlist) {
        wishlist = await Wishlist.create({ userId: req.user.id, items: [{ productId }] });
    } else {
        const exists = wishlist.items.some((i) => i.productId.toString() === productId);
        if (exists) throw new ApiError(409, 'Product already in wishlist.');
        wishlist.items.push({ productId });
        await wishlist.save();
    }
    res.status(201).json(new ApiResponse(201, wishlist.items, 'Added to wishlist.'));
});

// DELETE /api/user/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) throw new ApiError(404, 'Wishlist not found.');

    wishlist.items = wishlist.items.filter((i) => i.productId.toString() !== req.params.productId);
    await wishlist.save();
    res.status(200).json(new ApiResponse(200, wishlist.items, 'Removed from wishlist.'));
});
