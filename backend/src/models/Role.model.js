import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        permissions: [{ type: String }],
        description: { type: String },
        isSystem: { type: Boolean, default: false }, // System roles like 'superadmin' cannot be deleted
    },
    { timestamps: true }
);

const Role = mongoose.model('Role', roleSchema);
export default Role;
