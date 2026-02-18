import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Order from '../../../models/Order.model.js';
import Commission from '../../../models/Commission.model.js';

// GET /api/vendor/orders
export const getVendorOrders = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const filter = { 'vendorItems.vendorId': req.user.id };
    if (status) filter['vendorItems.status'] = status;

    const orders = await Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    const total = await Order.countDocuments(filter);
    res.status(200).json(new ApiResponse(200, { orders, total, page: Number(page), pages: Math.ceil(total / limit) }, 'Orders fetched.'));
});

// PATCH /api/vendor/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const allowed = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) throw new ApiError(400, `Status must be one of: ${allowed.join(', ')}`);

    const order = await Order.findOne({ orderId: req.params.id, 'vendorItems.vendorId': req.user.id });
    if (!order) throw new ApiError(404, 'Order not found.');

    // Update only this vendor's items status
    order.vendorItems = order.vendorItems.map((vi) =>
        vi.vendorId.toString() === req.user.id ? { ...vi.toObject(), status } : vi
    );
    await order.save();
    res.status(200).json(new ApiResponse(200, order, 'Order status updated.'));
});

// GET /api/vendor/earnings
export const getEarnings = asyncHandler(async (req, res) => {
    const commissions = await Commission.find({ vendorId: req.user.id });
    const summary = commissions.reduce((acc, c) => {
        acc.totalEarnings += c.vendorEarnings;
        acc.totalCommission += c.commission;
        acc.totalOrders += 1;
        if (c.status === 'pending') acc.pendingEarnings += c.vendorEarnings;
        if (c.status === 'paid') acc.paidEarnings += c.vendorEarnings;
        return acc;
    }, { totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0, totalCommission: 0, totalOrders: 0 });

    res.status(200).json(new ApiResponse(200, { summary, commissions }, 'Earnings fetched.'));
});
