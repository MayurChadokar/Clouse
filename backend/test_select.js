import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.model.js';

dotenv.config();

async function testSelectFalse() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        let user = await User.findOne({ phone: '9876543210' });
        if (!user) {
            user = await User.create({ name: 'test', email: 'x@x.com', password: 'abc', phone: '9876543210' });
        }

        // Unselected doc
        user.otp = '777888';
        user.otpExpiry = new Date();
        await user.save({ validateBeforeSave: false });

        const freshUser = await User.findById(user._id).select('+otp');
        console.log('Unselected save result:', freshUser.otp);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
testSelectFalse();
