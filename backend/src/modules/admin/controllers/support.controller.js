import SupportTicket from '../../../models/SupportTicket.model.js';
import TicketType from '../../../models/TicketType.model.js';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

/**
 * @desc    Get all support tickets with filtering and pagination
 * @route   GET /api/admin/support/tickets
 * @access  Private (Admin)
 */
export const getAllTickets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', status, priority } = req.query;

    const filter = {};

    if (status && status !== 'all') {
        filter.status = status;
    }

    if (priority && priority !== 'all') {
        filter.priority = priority;
    }

    if (search) {
        filter.$or = [
            { subject: { $regex: search, $options: 'i' } },
            // If search is an ID
            ...(search.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: search }] : [])
        ];
    }

    const tickets = await SupportTicket.find(filter)
        .populate('userId', 'name email phone')
        .populate('vendorId', 'shopName email')
        .populate('ticketTypeId', 'name')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(filter);

    // Normalize for frontend
    const normalizedTickets = tickets.map(ticket => ({
        ...ticket._doc,
        id: ticket._id,
        customer: ticket.userId ? {
            name: ticket.userId.name,
            email: ticket.userId.email,
            phone: ticket.userId.phone
        } : (ticket.vendorId ? {
            name: ticket.vendorId.shopName,
            email: ticket.vendorId.email
        } : { name: 'Anonymous' }),
        category: ticket.ticketTypeId ? ticket.ticketTypeId.name : 'General',
        lastUpdate: ticket.updatedAt
    }));

    res.status(200).json(
        new ApiResponse(200, {
            tickets: normalizedTickets,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        }, 'Support tickets fetched successfully')
    );
});

/**
 * @desc    Get ticket details with messages
 * @route   GET /api/admin/support/tickets/:id
 * @access  Private (Admin)
 */
export const getTicketById = asyncHandler(async (req, res) => {
    const ticket = await SupportTicket.findById(req.params.id)
        .populate('userId', 'name email phone')
        .populate('vendorId', 'shopName email')
        .populate('ticketTypeId', 'name');

    if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
    }

    // Normalize
    const normalized = {
        ...ticket._doc,
        id: ticket._id,
        customer: ticket.userId ? {
            name: ticket.userId.name,
            email: ticket.userId.email,
            phone: ticket.userId.phone
        } : (ticket.vendorId ? {
            name: ticket.vendorId.shopName,
            email: ticket.vendorId.email
        } : { name: 'Anonymous' }),
        category: ticket.ticketTypeId ? ticket.ticketTypeId.name : 'General'
    };

    res.status(200).json(
        new ApiResponse(200, normalized, 'Ticket details fetched successfully')
    );
});

/**
 * @desc    Update ticket status
 * @route   PATCH /api/admin/support/tickets/:id/status
 * @access  Private (Admin)
 */
export const updateTicketStatus = asyncHandler(async (req, res) => {
    const { status, priority } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;

    await ticket.save();

    res.status(200).json(
        new ApiResponse(200, ticket, 'Ticket status updated successfully')
    );
});

/**
 * @desc    Add message to ticket
 * @route   POST /api/admin/support/tickets/:id/messages
 * @access  Private (Admin)
 */
export const addTicketMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
    }

    ticket.messages.push({
        senderId: req.user._id, // Assuming req.user is set by auth middleware
        senderType: 'admin',
        message
    });

    // Automatically set to in_progress if an admin replies
    if (ticket.status === 'open') {
        ticket.status = 'in_progress';
    }

    await ticket.save();

    res.status(200).json(
        new ApiResponse(200, ticket.messages[ticket.messages.length - 1], 'Message added successfully')
    );
});
