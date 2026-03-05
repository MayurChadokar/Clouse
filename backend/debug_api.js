import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Order } from './src/models/Order.model.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const order = await Order.findOne({ orderId: 'ORD-1772449273301-J6EN' });
        if (!order) {
            console.log('Order not found');
            process.exit(0);
        }

        const vendorId = order.vendorItems[0].vendorId.toString();

        const token = jwt.sign(
            { id: vendorId, role: 'vendor', accountStatus: 'approved' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('Sending PATCH request to http://localhost:5000/api/vendor/orders/ORD-1772449273301-J6EN/status');
        const res = await fetch(
            'http://localhost:5000/api/vendor/orders/ORD-1772449273301-J6EN/status',
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'ready_for_delivery' })
            }
        );

        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Response data:', JSON.stringify(data, null, 2));

    } catch (err) {
        console.error(err.message);
    }
    process.exit(0);
});
