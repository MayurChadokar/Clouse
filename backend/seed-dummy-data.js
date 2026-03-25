
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User.model.js';
import { Vendor } from './src/models/Vendor.model.js';
import DeliveryBoy from './src/models/DeliveryBoy.model.js';

const seedDummyData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const dummyFCMToken = 'dummy_token_' + Math.random().toString(36).substring(7);

        // 1. Create Dummy User
        const userEmail = 'dummy_user_' + Date.now() + '@example.com';
        const user = await User.create({
            name: 'Dummy User',
            email: userEmail,
            password: 'password123',
            fcmTokens: [dummyFCMToken]
        });
        console.log(`👤 Created Dummy User: ${userEmail} with token stored.`);

        // 2. Create Dummy Vendor
        const vendorEmail = 'dummy_vendor_' + Date.now() + '@example.com';
        const vendor = await Vendor.create({
            name: 'Dummy Vendor',
            email: vendorEmail,
            password: 'password123',
            storeName: 'Dummy Store',
            fcmTokens: [dummyFCMToken]
        });
        console.log(`🏪 Created Dummy Vendor: ${vendorEmail} with token stored.`);

        // 3. Create Dummy Delivery Boy
        const deliveryEmail = 'dummy_delivery_' + Date.now() + '@example.com';
        const deliveryBoy = await DeliveryBoy.create({
            name: 'Dummy Delivery',
            email: deliveryEmail,
            password: 'password123',
            phone: '1234567890',
            fcmTokens: [dummyFCMToken]
        });
        console.log(`🚚 Created Dummy Delivery Boy: ${deliveryEmail} with token stored.`);

        console.log('\n--- VERIFYING STORAGE ---');
        
        const verifiedUser = await User.findOne({ email: userEmail });
        const verifiedVendor = await Vendor.findOne({ email: vendorEmail });
        const verifiedDelivery = await DeliveryBoy.findOne({ email: deliveryEmail });

        console.log(`User Token stored: ${verifiedUser.fcmTokens.includes(dummyFCMToken)}`);
        console.log(`Vendor Token stored: ${verifiedVendor.fcmTokens.includes(dummyFCMToken)}`);
        console.log(`Delivery Boy Token stored: ${verifiedDelivery.fcmTokens.includes(dummyFCMToken)}`);
        
        if (verifiedUser.fcmTokens.includes(dummyFCMToken) && 
            verifiedVendor.fcmTokens.includes(dummyFCMToken) && 
            verifiedDelivery.fcmTokens.includes(dummyFCMToken)) {
            console.log('\n✅ SUCCESS: FCM tokens are correctly stored in all models.');
        } else {
            console.log('\n❌ FAILURE: One or more tokens were not stored correctly.');
        }

    } catch (err) {
        console.error('❌ Error during seeding:', err);
    } finally {
        await mongoose.disconnect();
    }
};

seedDummyData();
