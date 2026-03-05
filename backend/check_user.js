import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.model.js';

dotenv.config();

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ phone: '9876543210' }).select('+otp +otpExpiry');
        console.log('User:', JSON.stringify(user, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
checkUser();
