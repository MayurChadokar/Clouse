import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.model.js';
import { sendOTP } from './src/services/otp.service.js';

dotenv.config();

async function testOtpFlow() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const mobileNumber = '9876543210';
        console.log('Testing OTP for mobile:', mobileNumber);

        let user = await User.findOne({ phone: mobileNumber });
        if (!user) {
            console.log('User not found. Creating one...');
            user = await User.create({
                name: 'Test Customer',
                email: 'testcustomer@example.com',
                password: 'password123',
                phone: mobileNumber
            });
            console.log('User created:', user._id);
        } else {
            console.log('User found:', user._id);
        }

        // Send OTP
        const otpSent = await sendOTP(user, 'otp_request');
        console.log(`Generated OTP: ${otpSent}`);

        // Fetch back and check
        const fetchedUser = await User.findById(user._id).select('+otp +otpExpiry');
        console.log(`Stored OTP in DB: ${fetchedUser.otp}`);

        await mongoose.disconnect();
    } catch (e) {
        console.error('Error:', e);
    }
}

testOtpFlow();
