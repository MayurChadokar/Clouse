import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order } from './src/models/Order.model.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const order = await Order.findOne({ orderId: 'ORD-1772449273301-J6EN' });
        if (!order) {
            console.log('Order not found');
            process.exit(0);
        }

        console.log('Current order status:', order.status);
        const status = 'ready_for_delivery';

        const vendorId = order.vendorItems[0].vendorId.toString();

        order.vendorItems = order.vendorItems.map((vi) =>
            vi.vendorId.toString() === vendorId ? { ...vi.toObject(), status } : vi
        );

        await order.save();
        console.log('Saved successfully');
    } catch (err) {
        console.error('Error caught:');
        if (err.errors) {
            Object.keys(err.errors).forEach(k => {
                console.error(`Field: ${k}, Message: ${err.errors[k].message}`);
            });
        } else {
            console.error(err.message, err.name);
        }
    }
    process.exit(0);
});
