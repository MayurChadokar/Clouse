import ReturnRequest from '../../../models/ReturnRequest.model.js';
import Order from '../../../models/Order.model.js';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

/**
 * @desc    Get all return requests with filtering and pagination
 * @route   GET /api/admin/return-requests
 * @access  Private (Admin)
 */
export const getAllReturnRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', status } = req.query;

    const filter = {};

    if (status && status !== 'all') {
        filter.status = status;
    }

    // Search by Return ID (Object ID) or Order ID (Object ID)
    // Note: In a real scenario, we might want to search by customer name/email via population
    if (search) {
        if (search.match(/^[0-9a-fA-F]{24}$/)) {
            filter.$or = [{ _id: search }, { orderId: search }];
        }
    }

    const returnRequests = await ReturnRequest.find(filter)
        .populate('userId', 'name email phone')
        .populate('orderId', 'orderId total')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await ReturnRequest.countDocuments(filter);

    // Normalize data for frontend
    const normalizedRequests = returnRequests.map(req => ({
        ...req._doc,
        id: req._id,
        customer: req.userId ? {
            name: req.userId.name,
            email: req.userId.email,
            phone: req.userId.phone
        } : { name: 'Guest', email: 'N/A' },
        orderId: req.orderId ? req.orderId.orderId : 'N/A',
        requestDate: req.createdAt
    }));

    res.status(200).json(
        new ApiResponse(200, {
            returnRequests: normalizedRequests,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        }, 'Return requests fetched successfully')
    );
});

/**
 * @desc    Get return request detail
 * @route   GET /api/admin/return-requests/:id
 * @access  Private (Admin)
 */
export const getReturnRequestById = asyncHandler(async (req, res) => {
    const request = await ReturnRequest.findById(req.params.id)
        .populate('userId', 'name email phone')
        .populate('orderId')
        .populate('vendorId', 'shopName email');

    if (!request) {
        throw new ApiError(404, 'Return request not found');
    }

    // Normalize
    const normalized = {
        ...request._doc,
        id: request._id,
        customer: request.userId ? {
            name: request.userId.name,
            email: request.userId.email,
            phone: request.userId.phone
        } : { name: 'Guest', email: 'N/A' },
        requestDate: request.createdAt
    };

    res.status(200).json(
        new ApiResponse(200, normalized, 'Return request details fetched successfully')
    );
});

/**
 * @desc    Update return request status
 * @route   PATCH /api/admin/return-requests/:id/status
 * @access  Private (Admin)
 */
export const updateReturnRequestStatus = asyncHandler(async (req, res) => {
    const { status, adminNote, refundStatus } = req.body;

    const request = await ReturnRequest.findById(req.params.id);

    if (!request) {
        throw new ApiError(404, 'Return request not found');
    }

    if (status) request.status = status;
    if (adminNote !== undefined) request.adminNote = adminNote;
    if (refundStatus) request.refundStatus = refundStatus;

    await request.save();

    // If approved, you might want to automate order status update or notify user
    if (status === 'approved') {
        // Logic for approved return
    }

    res.status(200).json(
        new ApiResponse(200, request, 'Return request status updated successfully')
    );
});
