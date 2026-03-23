import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;

const deliveryBoySchema = new mongoose.Schema({
    password: String
}, { strict: false });

const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);

async function resetPassword() {
    await mongoose.connect(MONGO_URI);
    const email = 'mayur@example.com';
    const pwd = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pwd, salt);

    const boy = await DeliveryBoy.findOneAndUpdate(
        { email },
        { password: hashedPassword, applicationStatus: 'approved', isActive: true },
        { new: true }
    );

    if (boy) {
        console.log(`Password reset for ${email} to: ${pwd}`);
    } else {
        console.log(`User ${email} not found.`);
    }
    process.exit(0);
}

resetPassword().catch(console.error);
