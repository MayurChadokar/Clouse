import mongoose from 'mongoose';
import DeliveryBoy from './src/models/DeliveryBoy.model.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function check() {
    const uri = process.env.MONGO_URI;
    console.log(`Checking DB: ${uri}`);
    try {
        await mongoose.connect(uri);
        const count = await DeliveryBoy.countDocuments();
        console.log(`Total delivery boys: ${count}`);

        const demo = await DeliveryBoy.findOne({ email: 'delivery@delivery.com' });
        if (demo) {
            console.log('Demo delivery boy exists.');
            console.log(`Status: ${demo.applicationStatus}, Active: ${demo.isActive}`);
        } else {
            console.log('Demo delivery boy MISSING.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
