import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Role from '../../../models/Role.model.js';

// Get all roles
export const getAllRoles = asyncHandler(async (req, res) => {
    const roles = await Role.find().sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, roles, 'Roles fetched successfully.'));
});

// Create new role
export const createRole = asyncHandler(async (req, res) => {
    const { name, permissions, description } = req.body;

    if (!name) {
        throw new ApiError(400, 'Role name is required.');
    }

    const existing = await Role.findOne({ name });
    if (existing) throw new ApiError(400, 'Role name already exists.');

    const role = await Role.create({
        name,
        permissions: permissions || [],
        description: description || ''
    });

    res.status(201).json(new ApiResponse(201, role, 'Role created successfully.'));
});

// Update role
export const updateRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, permissions, description } = req.body;

    const role = await Role.findById(id);
    if (!role) throw new ApiError(404, 'Role not found.');

    if (role.isSystem) {
        throw new ApiError(403, 'System roles cannot be modified.');
    }

    if (name) role.name = name;
    if (permissions) role.permissions = permissions;
    if (description !== undefined) role.description = description;

    await role.save();

    res.status(200).json(new ApiResponse(200, role, 'Role updated successfully.'));
});

// Delete role
export const deleteRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const role = await Role.findById(id);

    if (!role) throw new ApiError(404, 'Role not found.');
    if (role.isSystem) {
        throw new ApiError(403, 'System roles cannot be deleted.');
    }

    await Role.findByIdAndDelete(id);

    res.status(200).json(new ApiResponse(200, null, 'Role deleted successfully.'));
});
