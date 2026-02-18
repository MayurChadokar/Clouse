import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as productController from '../controllers/product.controller.js';
import * as orderController from '../controllers/order.controller.js';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize } from '../../../middlewares/authorize.js';
import { authLimiter } from '../../../middlewares/rateLimiter.js';

const router = Router();
const vendorAuth = [authenticate, authorize('vendor')];

// Auth
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/verify-otp', authController.verifyOTP);
router.post('/auth/login', authLimiter, authController.login);
router.get('/auth/profile', ...vendorAuth, authController.getProfile);
router.put('/auth/profile', ...vendorAuth, authController.updateProfile);

// Products
router.get('/products', ...vendorAuth, productController.getVendorProducts);
router.post('/products', ...vendorAuth, productController.createProduct);
router.put('/products/:id', ...vendorAuth, productController.updateProduct);
router.delete('/products/:id', ...vendorAuth, productController.deleteProduct);
router.patch('/stock/:productId', ...vendorAuth, productController.updateStock);

// Orders
router.get('/orders', ...vendorAuth, orderController.getVendorOrders);
router.patch('/orders/:id/status', ...vendorAuth, orderController.updateOrderStatus);

// Earnings
router.get('/earnings', ...vendorAuth, orderController.getEarnings);

export default router;
