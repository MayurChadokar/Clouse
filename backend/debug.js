import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order } from './src/models/Order.model.js';
import { Vendor } from './src/models/Vendor.model.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const order = await Order.findOne({ orderId: 'ORD-1772449273301-J6EN' });
        if (!order) {
            console.log('Order not found');
            process.exit(0);
        }
        console.log('Current order status:', order.status);
        order.status = 'ready_for_delivery';
        if (order.vendorItems.length > 0) {
            order.vendorItems[0].status = 'ready_for_delivery';
            console.log('Vendor status set to', order.vendorItems[0].status);
        }
        const vendor = await Vendor.findById(order.vendorItems[0].vendorId);
        if (vendor && vendor.shopLocation) {
            order.pickupLocation = vendor.shopLocation;
        }
        await order.save();
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
