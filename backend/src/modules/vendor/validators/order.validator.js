import Joi from 'joi';

const allowedStatuses = [
    'pending',
    'processing',
    'ready_for_delivery',
    'shipped',
    'delivered',
    'cancelled',
];

export const updateOrderStatusSchema = Joi.object({
    status: Joi.string()
        .required()
        .trim()
        .valid(...allowedStatuses)
        .insensitive() // Makes validation case-insensitive
        .messages({
            'string.base': 'Status must be a text string',
            'string.empty': 'Status cannot be empty',
            'any.required': 'Status field is required',
            'any.only': `Status must be one of: ${allowedStatuses.join(', ')}`,
        }),
});
