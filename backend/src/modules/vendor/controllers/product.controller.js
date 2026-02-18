import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import Product from '../../../models/Product.model.js';
import { slugify } from '../../../utils/slugify.js';

// GET /api/vendor/products
export const getVendorProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, stock } = req.query;
    const skip = (page - 1) * limit;
    const filter = { vendorId: req.user.id };
    if (search) filter.$text = { $search: search };
    if (stock) filter.stock = stock;

    const products = await Product.find(filter).populate('categoryId', 'name').populate('brandId', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    const total = await Product.countDocuments(filter);
    res.status(200).json(new ApiResponse(200, { products, total, page: Number(page), pages: Math.ceil(total / limit) }, 'Products fetched.'));
});

// POST /api/vendor/products
export const createProduct = asyncHandler(async (req, res) => {
    const { name, ...rest } = req.body;
    const slug = slugify(name) + '-' + Date.now();
    const product = await Product.create({ name, slug, vendorId: req.user.id, ...rest });
    res.status(201).json(new ApiResponse(201, product, 'Product created.'));
});

// PUT /api/vendor/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!product) throw new ApiError(404, 'Product not found or access denied.');
    Object.assign(product, req.body);
    await product.save();
    res.status(200).json(new ApiResponse(200, product, 'Product updated.'));
});

// DELETE /api/vendor/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findOneAndDelete({ _id: req.params.id, vendorId: req.user.id });
    if (!product) throw new ApiError(404, 'Product not found or access denied.');
    res.status(200).json(new ApiResponse(200, null, 'Product deleted.'));
});

// PATCH /api/vendor/stock/:productId
export const updateStock = asyncHandler(async (req, res) => {
    const { stockQuantity } = req.body;
    const product = await Product.findOne({ _id: req.params.productId, vendorId: req.user.id });
    if (!product) throw new ApiError(404, 'Product not found.');

    product.stockQuantity = stockQuantity;
    if (stockQuantity <= 0) product.stock = 'out_of_stock';
    else if (stockQuantity <= product.lowStockThreshold) product.stock = 'low_stock';
    else product.stock = 'in_stock';
    await product.save();

    res.status(200).json(new ApiResponse(200, product, 'Stock updated.'));
});
