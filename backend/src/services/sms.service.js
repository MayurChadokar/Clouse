/**
 * SMS India Hub — OTP delivery service
 * Docs: https://www.smsindiahub.in/api
 *
 * Required env vars:
 *   SMS_INDIA_HUB_API_KEY   — your API key from SMS India Hub dashboard
 *   SMS_INDIA_HUB_SENDER    — approved 6-char sender ID  (e.g. CLOUSE)
 *   SMS_INDIA_HUB_TEMPLATE  — DLT-approved template ID  (numeric string)
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const API_BASE = 'http://cloud.smsindiahub.in/vendorsms/pushsms.aspx';

/**
 * Send a transactional SMS OTP via SMS India Hub
 *
 * @param {string} mobile  - 10-digit Indian mobile number (no country code)
 * @param {string} otp     - 6-digit OTP string
 * @returns {Promise<void>}
 */
export const sendSmsOtp = async (mobile, otp) => {
    const apiKey = process.env.SMS_INDIA_HUB_API_KEY;
    const sender = process.env.SMS_INDIA_HUB_SENDER;
    const templateId = process.env.SMS_INDIA_HUB_TEMPLATE;
    const peId = process.env.SMS_INDIA_HUB_PE_ID; // Principal Entity ID (DLT)

    if (!apiKey || !sender || !templateId) {
        throw new Error('[SMS] SMS India Hub credentials not configured. Set SMS_INDIA_HUB_API_KEY, SMS_INDIA_HUB_SENDER, and SMS_INDIA_HUB_TEMPLATE in .env');
    }

    // Ensure mobile is exactly 10 digits
    const normalizedMobile = String(mobile || '').replace(/\D/g, '').slice(-10);
    if (normalizedMobile.length !== 10) {
        throw new Error(`[SMS] Invalid mobile number: ${mobile}`);
    }

    // IMPORTANT: This message MUST match your DLT approved template EXACTLY
    const messageText = `Your Clouse verification code is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;
    
    const url = new URL(API_BASE);
    url.searchParams.set('APIKey', apiKey);
    url.searchParams.set('msisdn', `91${normalizedMobile}`);
    url.searchParams.set('msg', messageText);
    url.searchParams.set('sid', sender);
    url.searchParams.set('fl', '0');
    url.searchParams.set('gwid', '2');
    url.searchParams.set('DLT_TE_ID', templateId);
    if (peId) {
        url.searchParams.set('DLT_PE_ID', peId);
    }

    if (process.env.NODE_ENV !== 'production') {
        console.log(`[SMS][Debug] Sending to ${normalizedMobile} | Sender: ${sender} | Template: ${templateId} | PE: ${peId || 'N/A'}`);
        console.log(`[SMS][Debug] Content: "${messageText}"`);
    }

    return new Promise((resolve, reject) => {
        const client = url.protocol === 'https:' ? https : http;
        const req = client.get(url.toString(), (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const responseStr = data.trim();
                if (responseStr.startsWith('ERROR') || responseStr.toLowerCase().includes('error')) {
                    console.error(`[SMS] SMS India Hub error: ${responseStr}`);
                    reject(new Error(`SMS delivery failed: ${responseStr}`));
                } else {
                    console.log(`[SMS] Response: ${responseStr}`);
                    resolve(responseStr);
                }
            });
        });

        req.on('error', (err) => {
            console.error('[SMS] Connection error:', err.message);
            reject(err);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('[SMS] Request timed out after 10s'));
        });
    });
};

