import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const orderSchema = new mongoose.Schema({
    orderId: String,
    status: String,
    deliveryBoyId: mongoose.Schema.Types.ObjectId,
    isDeleted: Boolean
}, { strict: false });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema, 'orders');

async function testAccept() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find a pending order and make it READY FOR DELIVERY
        const order = await Order.findOne({ status: { $in: ['pending', 'processing', 'shipped'] } });

        if (!order) {
            console.log('No eligible order found to test.');
            return;
        }

        console.log(`Original Order: ${order.orderId} (Status: ${order.status})`);

        order.status = 'ready_for_delivery';
        order.deliveryBoyId = undefined; // Unassign it
        await order.save();

        console.log(`\nUpdated Order: ${order.orderId} (Status: ${order.status})`);
        console.log('This order should now show up in the AVAILABLE tab of the delivery panel.');

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

testAccept();
