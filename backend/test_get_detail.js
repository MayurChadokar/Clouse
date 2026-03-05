import axios from 'axios';

async function testDetail() {
    try {
        // First login to get token
        const loginRes = await axios.post('http://localhost:5000/api/delivery/auth/login', {
            email: "demo@delivery.com",
            password: "demo_delivery_pass"
        });
        const token = loginRes.data.data.accessToken;

        // Try to get detail of an order (I'll use the one I just forced)
        const orderId = "ORD-1772438490143-6JCZ";
        const res = await axios.get(`http://localhost:5000/api/delivery/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Status:', res.status);
        console.log('Order Data:', JSON.stringify(res.data.data, null, 2));

    } catch (err) {
        console.error('Error Status:', err.response?.status);
        console.log('Error Message:', err.response?.data?.message || err.message);
    }
}

testDetail();
