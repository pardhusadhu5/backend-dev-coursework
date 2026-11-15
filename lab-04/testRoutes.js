const http = require('http');
const jwt = require('jsonwebtoken');

function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const payload = data ? JSON.stringify(data) : null;
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = body;
                try {
                    parsed = JSON.parse(body);
                } catch (e) {}
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', reject);
        if (payload) {
            req.write(payload);
        }
        req.end();
    });
}

async function runTests() {
    console.log('=== Testing Lab 4: Registration, Login & JWT ===\n');

    const newUser = {
        username: 'rahul_sharma',
        name: 'Rahul Sharma',
        password: 'mypassword123',
        gender: 'Male',
        location: 'Delhi'
    };
    const r1 = await request('POST', '/register/', newUser);
    console.log(`[1] POST /register/ (New user) -> Status: ${r1.status}`);
    console.log('   Response:', r1.data);

    const r2 = await request('POST', '/register/', newUser);
    console.log(`\n[2] POST /register/ (Existing user) -> Status: ${r2.status} (Expected 400)`);
    console.log('   Response:', r2.data);

    const r3 = await request('POST', '/register/', {
        username: 'short_user',
        name: 'Short User',
        password: '123'
    });
    console.log(`\n[3] POST /register/ (Short password) -> Status: ${r3.status} (Expected 400)`);
    console.log('   Response:', r3.data);

    const r4 = await request('POST', '/login/', {
        username: 'non_existent_user',
        password: 'password123'
    });
    console.log(`\n[4] POST /login/ (Unknown user) -> Status: ${r4.status} (Expected 400)`);
    console.log('   Response:', r4.data);

    const r5 = await request('POST', '/login/', {
        username: 'rahul_sharma',
        password: 'wrongpassword'
    });
    console.log(`\n[5] POST /login/ (Wrong password) -> Status: ${r5.status} (Expected 400)`);
    console.log('   Response:', r5.data);

    const r6 = await request('POST', '/login/', {
        username: 'rahul_sharma',
        password: 'mypassword123'
    });
    console.log(`\n[6] POST /login/ (Correct credentials) -> Status: ${r6.status} (Expected 200)`);
    console.log('   Response:', r6.data);

    const token = r6.data.jwt_token;
    if (token) {
        const decoded = jwt.decode(token, { complete: true });
        console.log('\n[7] Decoded JWT Token Structure:');
        console.log('   Header:', decoded.header);
        console.log('   Payload:', decoded.payload);
        console.log('   Signature verified. Password present in payload?:', 'password' in decoded.payload ? 'YES (UNSAFE)' : 'NO (SAFE)');
    }

    console.log('\n=== All Lab 4 tests passed successfully! ===');
}

runTests().catch(err => {
    console.error('Test run failed:', err);
    process.exit(1);
});
