import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import User from '../../../models/User.model.js';
import Order from '../../../models/Order.model.js';

/**
 * @desc    Get all customers with pagination and filters
 * @route   GET /api/admin/customers
 * @access  Private (Admin)
 */
export const getAllCustomers = asyncHandler(async (req, res) => {
    const { status, search, page = 1, limit = 10 } = req.query;

    const filter = { role: 'customer' };

    if (status) {
        filter.isActive = status === 'active';
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const customers = await User.find(filter)
        .select('-password -otp -otpExpiry')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    // Aggregate stats for each customer
    const customersWithStats = await Promise.all(customers.map(async (customer) => {
        const stats = await Order.aggregate([
            { $match: { userId: customer._id } },
            {
                $group: {
                    _id: null,
                    orders: { $sum: 1 },
                    totalSpent: { $sum: '$total' }
                }
            }
        ]);

        const customerStats = stats.length > 0 ? stats[0] : { orders: 0, totalSpent: 0 };
        return {
            ...customer._doc,
            orders: customerStats.orders,
            totalSpent: customerStats.totalSpent
        };
    }));

    res.status(200).json(
        new ApiResponse(200, {
            customers: customersWithStats,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        }, 'Customers fetched successfully')
    );
});

/**
 * @desc    Get customer details with order summary
 * @route   GET /api/admin/customers/:id
 * @access  Private (Admin)
 */
export const getCustomerById = asyncHandler(async (req, res) => {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' })
        .select('-password -otp -otpExpiry');

    if (!customer) {
        throw new ApiError(404, 'Customer not found');
    }

    // Get order statistics for this customer
    const orderStats = await Order.aggregate([
        { $match: { userId: customer._id } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$total' },
                lastOrderDate: { $max: '$createdAt' }
            }
        }
    ]);

    const stats = orderStats.length > 0 ? orderStats[0] : {
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: null
    };

    res.status(200).json(
        new ApiResponse(200, {
            ...customer._doc,
            orders: stats.totalOrders,
            totalSpent: stats.totalSpent,
            lastOrderDate: stats.lastOrderDate
        }, 'Customer details fetched successfully')
    );
});

/**
 * @desc    Toggle customer active status
 * @route   PATCH /api/admin/customers/:id/status
 * @access  Private (Admin)
 */
export const updateCustomerStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        throw new ApiError(400, 'isActive status must be a boolean');
    }

    const customer = await User.findOneAndUpdate(
        { _id: req.params.id, role: 'customer' },
        { isActive },
        { new: true }
    ).select('-password');

    if (!customer) {
        throw new ApiError(404, 'Customer not found');
    }

    res.status(200).json(
        new ApiResponse(200, customer, `Customer status updated to ${isActive ? 'active' : 'inactive'}`)
    );
});

/**
 * @desc    Update customer details
 * @route   PUT /api/admin/customers/:id
 * @access  Private (Admin)
 */
export const updateCustomerDetail = asyncHandler(async (req, res) => {
    const { name, phone } = req.body;

    const customer = await User.findOneAndUpdate(
        { _id: req.params.id, role: 'customer' },
        { name, phone },
        { new: true, runValidators: true }
    ).select('-password');

    if (!customer) {
        throw new ApiError(404, 'Customer not found');
    }

    res.status(200).json(
        new ApiResponse(200, customer, 'Customer updated successfully')
    );
});
