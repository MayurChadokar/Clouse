import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: String,
        type: { type: String, enum: ['email', 'push', 'sms'], required: true },
        status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
        targetAudience: { type: String, enum: ['all', 'customers', 'vendors'], default: 'all' },
        content: String,
        scheduledAt: Date,
        sentAt: Date,
    },
    { timestamps: true }
);

const Campaign = mongoose.model('Campaign', campaignSchema);
export { Campaign };
export default Campaign;
