import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as orderController from '../controllers/order.controller.js';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize } from '../../../middlewares/authorize.js';
import { authLimiter } from '../../../middlewares/rateLimiter.js';

const router = Router();
const deliveryAuth = [authenticate, authorize('delivery')];

// Auth
router.post('/auth/login', authLimiter, authController.login);
router.get('/auth/profile', ...deliveryAuth, authController.getProfile);
router.put('/auth/profile', ...deliveryAuth, authController.updateProfile);

// Orders
router.get('/orders', ...deliveryAuth, orderController.getAssignedOrders);
router.get('/orders/:id', ...deliveryAuth, orderController.getOrderDetail);
router.patch('/orders/:id/status', ...deliveryAuth, orderController.updateDeliveryStatus);

export default router;
