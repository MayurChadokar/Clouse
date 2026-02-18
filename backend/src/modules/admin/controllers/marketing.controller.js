import asyncHandler from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import Coupon from '../../../models/Coupon.model.js';
import Banner from '../../../models/Banner.model.js';
import Campaign from '../../../models/Campaign.model.js';

// ─── Coupons (Promo Codes) ──────────────────────────────────────────────────
export const getAllCoupons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};
    if (status) query.isActive = status === 'active';

    const coupons = await Coupon.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const count = await Coupon.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            coupons,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        }, 'Coupons fetched successfully')
    );
});

export const createCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.create(req.body);
    return res.status(201).json(new ApiResponse(201, coupon, 'Coupon created successfully'));
});

export const updateCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) throw new ApiError(404, 'Coupon not found');
    return res.status(200).json(new ApiResponse(200, coupon, 'Coupon updated successfully'));
});

export const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) throw new ApiError(404, 'Coupon not found');
    return res.status(200).json(new ApiResponse(200, null, 'Coupon deleted successfully'));
});

// ─── Banners ──────────────────────────────────────────────────────────────────
export const getAllBanners = asyncHandler(async (req, res) => {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, banners, 'Banners fetched successfully'));
});

export const createBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.create(req.body);
    return res.status(201).json(new ApiResponse(201, banner, 'Banner created successfully'));
});

export const updateBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) throw new ApiError(404, 'Banner not found');
    return res.status(200).json(new ApiResponse(200, banner, 'Banner updated successfully'));
});

export const deleteBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) throw new ApiError(404, 'Banner not found');
    return res.status(200).json(new ApiResponse(200, null, 'Banner deleted successfully'));
});

// ─── Campaigns ───────────────────────────────────────────────────────────────
export const getAllCampaigns = asyncHandler(async (req, res) => {
    const { status, type } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, campaigns, 'Campaigns fetched successfully'));
});

export const createCampaign = asyncHandler(async (req, res) => {
    const campaign = await Campaign.create(req.body);
    return res.status(201).json(new ApiResponse(201, campaign, 'Campaign created successfully'));
});

export const updateCampaign = asyncHandler(async (req, res) => {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!campaign) throw new ApiError(404, 'Campaign not found');
    return res.status(200).json(new ApiResponse(200, campaign, 'Campaign updated successfully'));
});

export const deleteCampaign = asyncHandler(async (req, res) => {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) throw new ApiError(404, 'Campaign not found');
    return res.status(200).json(new ApiResponse(200, null, 'Campaign deleted successfully'));
});
