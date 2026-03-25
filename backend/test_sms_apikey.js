import http from 'http';

const url = 'http://cloud.smsindiahub.in/vendorsms/pushsms.aspx';
const apiKey = 'BCIYO13pGkmdHgmGGFSqhA';

const req = http.get(`${url}?APIKey=${apiKey}&msisdn=917894561230&msg=Test&sid=SMSHUB&fl=0&gwid=2`, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
        console.log(`[PASS] APIKey Status: ${res.statusCode}`);
        console.log(`[PASS] Response: ${data}`);
    });
});
req.on('error', (err) => console.log(`[FAIL] Error: ${err.message}`));
req.setTimeout(10000, () => req.destroy());
