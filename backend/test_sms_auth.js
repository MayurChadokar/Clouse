import http from 'http';

const url = 'http://cloud.smsindiahub.in/api/sendhttp.php';

const req = http.get(`${url}?authkey=BCIYO13pGkmdHgmGGFSqhA&mobiles=917894561230&message=Test&sender=SMSHUB&route=4&country=91`, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
        console.log(`[PASS] Cloud Status: ${res.statusCode}`);
        console.log(`[PASS] Response: ${data}`);
    });
});
req.on('error', (err) => console.log(`[FAIL] Error: ${err.message}`));
req.setTimeout(10000, () => req.destroy());
