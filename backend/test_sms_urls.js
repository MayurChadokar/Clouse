import https from 'https';
import http from 'http';

const testUrls = [
    'https://msgclub.smsindiahub.in/api/sendhttp.php',
    'http://cloud.smsindiahub.in/api/sendhttp.php',
    'http://cloud.smsindiahub.in/vendorsms/pushsms.aspx',
];

const checkUrl = (url) => {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, (res) => {
            console.log(`[PASS] ${url} - Status: ${res.statusCode}`);
            resolve(true);
        });
        req.on('error', (err) => {
            console.log(`[FAIL] ${url} - Error: ${err.message}`);
            resolve(false);
        });
        req.setTimeout(5000, () => {
            console.log(`[TIMEOUT] ${url}`);
            req.destroy();
            resolve(false);
        });
    });
};

async function run() {
    for (const url of testUrls) {
        await checkUrl(url);
    }
}

run();
