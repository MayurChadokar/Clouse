async function testDetail() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/delivery/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "demo@delivery.com",
                password: "demo_delivery_pass"
            })
        });
        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            console.log('Login failed:', JSON.stringify(loginData, null, 2));
            return;
        }

        const token = loginData?.data?.accessToken;
        if (!token) {
            console.log('No token in response:', JSON.stringify(loginData, null, 2));
            return;
        }

        const orderId = "ORD-1772438490143-6JCZ";
        const res = await fetch(`http://localhost:5000/api/delivery/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Order Data:', JSON.stringify(data.data, null, 2));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

testDetail();
