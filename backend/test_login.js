async function test() {
    try {
        const response = await fetch('http://localhost:5000/api/delivery/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'delivery@delivery.com',
                password: 'delivery123'
            })
        });
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Login Failed!');
        console.error(err);
    }
}

test();
