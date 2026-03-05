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

async function checkOrders() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const orders = await Order.find({
            isDeleted: { $ne: true }
        }).select('orderId status deliveryBoyId createdAt').limit(20);

        console.log('\n--- Current Orders Status (Limit 20) ---');
        if (orders.length === 0) {
            console.log('No orders found in database.');
        } else {
            orders.forEach(o => {
                console.log(`ID: ${o.orderId} | Status: ${o.status} | DeliveryBoy: ${o.deliveryBoyId || 'NONE'}`);
            });
        }

        const availableOrders = await Order.find({
            status: 'ready_for_delivery',
            deliveryBoyId: { $exists: false },
            isDeleted: { $ne: true }
        });

        console.log(`\nAvailable for Delivery Count: ${availableOrders.length}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkOrders();
