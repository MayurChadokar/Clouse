
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.model.js';
import { createNotification } from './src/services/notification.service.js';

dotenv.config();

const testPush = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find a user with a token
        const user = await User.findOne({ fcmTokens: { $exists: true, $not: { $size: 0 } } });
        
        if (!user) {
            console.log('No user found with an FCM token. Testing with a dummy token...');
            const dummyToken = 'your_dummy_token_here_if_you_had_one'; 
            console.log('Dummy test: skipped as we need a real token for FCM to succeed.');
        } else {
            console.log(`Found user ${user.email} with ${user.fcmTokens.length} tokens.`);
            // Actually try sending to their tokens
            // await sendPushToTokens(user.fcmTokens, { title: 'Test', body: 'This is a test notification' });
            // console.log('Test push sent.');
        }

    } catch (err) {
        console.error('Error during test:', err);
    } finally {
        await mongoose.disconnect();
    }
};

testPush();
