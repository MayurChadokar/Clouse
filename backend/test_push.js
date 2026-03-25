import "dotenv/config";
import admin from './src/config/firebase.js';

async function testPush() {
    console.log('--- Testing Firebase Admin Authentication ---');
    try {
        const token = await admin.credential.cert(
            JSON.parse(await import('fs').then(fs => fs.promises.readFile(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')))
        ).getAccessToken();
        console.log('✅ Success! Access Token fetched:', token.access_token.substring(0, 10) + '...');
        
        console.log('--- Testing Dry Run Messaging ---');
        // Dry run send (doesn't actually send to a device, just tests auth + payload)
        const dummyToken = 'dUnMy_ToKeN_12345'; // Invalid token, but dry_run: true should still pass auth
        const message = {
            notification: { title: 'Test', body: 'This is a test' },
            token: dummyToken
        };
        
        const response = await admin.messaging().send(message, true); // dry_run = true
        console.log('✅ Success! Messaging service is ready. Response:', response);
    } catch (err) {
        console.error('❌ FAILURE:', err.message);
        if (err.message.includes('account not found')) {
            console.error('👉 REASON: The Service Account in your JSON file was likely deleted or disabled in the Google Cloud Console.');
        } else if (err.message.includes('invalid_grant')) {
            console.error('👉 REASON: Invalid credentials (revoked key or system clock out of sync).');
        }
    }
}

testPush();
