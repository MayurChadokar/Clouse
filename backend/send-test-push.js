
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/User.model.js';
import { createNotification } from './src/services/notification.service.js';

const testPush = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        console.log('FIREBASE_SERVICE_ACCOUNT_PATH:', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

        const user = await User.findOne({ email: 'isha@example.com' });
        
        if (user && user.fcmTokens.length > 0) {
            console.log(`Sending test notification to ${user.email} with ${user.fcmTokens.length} tokens...`);
            const notification = await createNotification({
                recipientId: user._id,
                recipientType: 'user',
                title: 'Test Notification',
                message: 'Hello, if you see this, push notifications are working!',
                type: 'system',
                data: { test: 'true' }
            });
            console.log('✅ createNotification finished. Check backend logs for FCM send response status.');
        } else {
            console.log('❌ No user found with that email or no tokens available.');
        }

    } catch (err) {
        console.error('❌ Error during test:', err);
    } finally {
        await mongoose.disconnect();
    }
};

testPush();
