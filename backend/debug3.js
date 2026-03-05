import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order } from './src/models/Order.model.js';
import { Vendor } from './src/models/Vendor.model.js';

dotenv.config();

const deriveTopLevelOrderStatus = (vendorItems = [], fallback = 'pending') => {
    const statuses = (vendorItems || [])
        .map((item) => String(item?.status || '').toLowerCase())
        .filter(Boolean);

    if (!statuses.length) return String(fallback || 'pending').toLowerCase();

    if (statuses.every((s) => s === 'cancelled')) return 'cancelled';
    if (statuses.every((s) => s === 'delivered')) return 'delivered';
    if (statuses.includes('shipped')) return 'shipped';
    if (statuses.includes('ready_for_delivery')) return 'ready_for_delivery';
    if (statuses.includes('processing')) return 'processing';
    if (statuses.includes('pending')) return 'pending';

    return String(fallback || 'pending').toLowerCase();
};

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const order = await Order.findOne({ orderId: 'ORD-1772449273301-J6EN' });
        if (!order) {
            console.log('Order not found');
            process.exit(0);
        }

        const status = 'ready_for_delivery';
        const vendorId = order.vendorItems[0].vendorId.toString();

        // Update only this vendor's items status
        order.vendorItems = order.vendorItems.map((vi) =>
            vi.vendorId.toString() === vendorId ? { ...vi.toObject(), status } : vi
        );
        order.status = deriveTopLevelOrderStatus(order.vendorItems, order.status);
        await order.save();

        if (status === 'ready_for_delivery') {
            const vendor = await mongoose.model('Vendor').findById(vendorId);
            if (vendor && vendor.shopLocation) {
                order.pickupLocation = vendor.shopLocation;
                await order.save();
            }
        }

        console.log('Saved successfully');
    } catch (err) {
        console.error('Error caught:');
        if (err.errors) {
            Object.keys(err.errors).forEach(k => {
                console.error(`Field: ${k}, Message: ${err.errors[k].message}`);
            });
        } else {
            console.error(err);
        }
    }
    process.exit(0);
});
