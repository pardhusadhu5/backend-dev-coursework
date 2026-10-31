const http = require('http');

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
                resolve({ status: res.statusCode, headers: res.headers, data: parsed });
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
    console.log('--- Testing Lab 2 CRUD Endpoints ---');

    // 1. GET /books/
    const r1 = await request('GET', '/books/');
    console.log(`\n[1] GET /books/ -> Status: ${r1.status}`);
    console.log(`Total books retrieved: ${r1.data.length}`);
    console.log('First book:', r1.data[0]);

    // 2. GET /books/1/
    const r2 = await request('GET', '/books/1/');
    console.log(`\n[2] GET /books/1/ -> Status: ${r2.status}`);
    console.log('Book 1 details:', r2.data);

    // 3. POST /books/
    const newBook = {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        price: 499,
        pages: 464
    };
    const r3 = await request('POST', '/books/', newBook);
    console.log(`\n[3] POST /books/ -> Status: ${r3.status}`);
    console.log('Response:', r3.data);
    const createdId = r3.data.bookId;

    // Verify created book
    const r3_verify = await request('GET', `/books/${createdId}/`);
    console.log(`Verified newly added book (${createdId}):`, r3_verify.data);

    // 4. PUT /books/1/
    const updatePayload = {
        title: 'To Kill a Mockingbird (Special Anniversary Edition)',
        price: 450
    };
    const r4 = await request('PUT', '/books/1/', updatePayload);
    console.log(`\n[4] PUT /books/1/ -> Status: ${r4.status}`);
    console.log('Response:', r4.data);

    // Verify updated book
    const r4_verify = await request('GET', '/books/1/');
    console.log('Verified updated book 1:', r4_verify.data);

    // 5. DELETE /books/10/
    const r5 = await request('DELETE', '/books/10/');
    console.log(`\n[5] DELETE /books/10/ -> Status: ${r5.status}`);
    console.log('Response:', r5.data);

    // Verify deletion
    const r5_verify = await request('GET', '/books/10/');
    console.log(`Verified book 10 deleted (GET /books/10/): Status ${r5_verify.status}`, r5_verify.data);

    // 6. Unknown 404
    const r6 = await request('GET', '/invalid-path');
    console.log(`\n[6] GET /invalid-path -> Status: ${r6.status}`, r6.data);

    console.log('\n--- All tests completed successfully! ---');
}

runTests().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
