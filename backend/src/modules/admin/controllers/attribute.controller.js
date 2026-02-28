import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Attribute from '../../../models/Attribute.model.js';
import AttributeValue from '../../../models/AttributeValue.model.js';
import AttributeSet from '../../../models/AttributeSet.model.js';

// ─── Attribute Management ─────────────────────────────────────────────────────

export const getAllAttributes = asyncHandler(async (req, res) => {
    const { search } = req.query;
    const filter = {};
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    const attributes = await Attribute.find(filter)
        .populate('values')
        .sort({ name: 1 });

    res.status(200).json(new ApiResponse(200, attributes, 'Attributes fetched.'));
});

export const createAttribute = asyncHandler(async (req, res) => {
    const { name, type, values = [] } = req.body;
    if (!name) throw new ApiError(400, 'Attribute name is required.');

    const attribute = await Attribute.create({ name, type });

    // Handle initial values if provided
    if (values && values.length > 0) {
        const valueDocs = await Promise.all(
            values.map(val => AttributeValue.create({
                attributeId: attribute._id,
                value: typeof val === 'string' ? val : val.value,
                colorCode: val.colorCode || null
            }))
        );
        attribute.values = valueDocs.map(v => v._id);
        await attribute.save();
    }

    const fullAttribute = await Attribute.findById(attribute._id).populate('values');
    res.status(201).json(new ApiResponse(201, fullAttribute, 'Attribute created.'));
});

export const updateAttribute = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, type } = req.body;

    const attribute = await Attribute.findByIdAndUpdate(
        id,
        { name, type },
        { new: true, runValidators: true }
    ).populate('values');

    if (!attribute) throw new ApiError(404, 'Attribute not found.');
    res.status(200).json(new ApiResponse(200, attribute, 'Attribute updated.'));
});

export const deleteAttribute = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const attribute = await Attribute.findById(id);
    if (!attribute) throw new ApiError(404, 'Attribute not found.');

    // Delete associated values
    await AttributeValue.deleteMany({ attributeId: id });
    await Attribute.findByIdAndDelete(id);

    res.status(200).json(new ApiResponse(200, null, 'Attribute deleted.'));
});

// ─── Attribute Values ─────────────────────────────────────────────────────────

export const addAttributeValue = asyncHandler(async (req, res) => {
    const { attributeId } = req.params;
    const { value, colorCode } = req.body;

    const attribute = await Attribute.findById(attributeId);
    if (!attribute) throw new ApiError(404, 'Attribute not found.');

    const newValue = await AttributeValue.create({
        attributeId,
        value,
        colorCode
    });

    attribute.values.push(newValue._id);
    await attribute.save();

    res.status(201).json(new ApiResponse(201, newValue, 'Value added.'));
});

export const deleteAttributeValue = asyncHandler(async (req, res) => {
    const { attributeId, valueId } = req.params;

    const attribute = await Attribute.findById(attributeId);
    if (!attribute) throw new ApiError(404, 'Attribute not found.');

    attribute.values = attribute.values.filter(v => v.toString() !== valueId);
    await attribute.save();
    await AttributeValue.findByIdAndDelete(valueId);

    res.status(200).json(new ApiResponse(200, null, 'Value deleted.'));
});

// ─── Attribute Sets ───────────────────────────────────────────────────────────

export const getAllAttributeSets = asyncHandler(async (req, res) => {
    const sets = await AttributeSet.find().populate('attributes');
    res.status(200).json(new ApiResponse(200, sets, 'Attribute sets fetched.'));
});

export const createAttributeSet = asyncHandler(async (req, res) => {
    const { name, attributes = [], values = [], isActive = true } = req.body;
    const set = await AttributeSet.create({ name, attributes, values, isActive });
    const fullSet = await AttributeSet.findById(set._id).populate('attributes');
    res.status(201).json(new ApiResponse(201, fullSet, 'Attribute set created.'));
});

export const updateAttributeSet = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, attributes, values, isActive } = req.body;
    const set = await AttributeSet.findByIdAndUpdate(
        id,
        { name, attributes, values, isActive },
        { new: true, runValidators: true }
    ).populate('attributes');
    if (!set) throw new ApiError(404, 'Attribute set not found.');
    res.status(200).json(new ApiResponse(200, set, 'Attribute set updated.'));
});

export const deleteAttributeSet = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const set = await AttributeSet.findByIdAndDelete(id);
    if (!set) throw new ApiError(404, 'Attribute set not found.');
    res.status(200).json(new ApiResponse(200, null, 'Attribute set deleted.'));
});
