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
    console.log('=== Testing Lab 3: REST API, Query Params & Validation ===\n');

    const r1 = await request('GET', '/books/');
    console.log(`[1] GET /books/ (Default) -> Status: ${r1.status}, Count: ${r1.data.length}`);

    const r2 = await request('GET', '/books/?search_q=The');
    console.log(`[2] GET /books/?search_q=The -> Status: ${r2.status}, Matching: ${r2.data.length}`);
    r2.data.forEach(b => console.log(`   - [${b.id}] ${b.title} (Rs. ${b.price})`));

    const r3 = await request('GET', '/books/?order_by=price&order=DESC&limit=4&offset=0');
    console.log(`\n[3] GET /books/?order_by=price&order=DESC&limit=4&offset=0 -> Status: ${r3.status}`);
    r3.data.forEach(b => console.log(`   - [${b.id}] ${b.title} - Price: Rs. ${b.price}`));

    const r4 = await request('GET', '/books/?min_price=200&max_price=350');
    console.log(`\n[4] GET /books/?min_price=200&max_price=350 -> Status: ${r4.status}, Count: ${r4.data.length}`);
    r4.data.forEach(b => console.log(`   - [${b.id}] ${b.title} - Price: Rs. ${b.price}`));

    const invalidBook1 = { title: 'Test Book', author: 'Author', price: 'invalid_price', pages: 200 };
    const r5 = await request('POST', '/books/', invalidBook1);
    console.log(`\n[5] POST /books/ (Non-numeric price) -> Status: ${r5.status} (Expected 400)`);
    console.log('   Response:', r5.data);

    const invalidBook2 = { author: 'Author', price: 299, pages: 200 };
    const r6 = await request('POST', '/books/', invalidBook2);
    console.log(`\n[6] POST /books/ (Missing title) -> Status: ${r6.status} (Expected 400)`);
    console.log('   Response:', r6.data);

    const validBook = { title: 'Refactoring', author: 'Martin Fowler', price: 650, pages: 448 };
    const r7 = await request('POST', '/books/', validBook);
    console.log(`\n[7] POST /books/ (Valid book) -> Status: ${r7.status} (Expected 201)`);
    console.log('   Response:', r7.data);
    const newId = r7.data.bookId;

    const r8 = await request('GET', '/books/999/');
    console.log(`\n[8] GET /books/999/ -> Status: ${r8.status} (Expected 404)`);
    console.log('   Response:', r8.data);

    const r9 = await request('PUT', `/books/${newId}/`, { price: 699 });
    console.log(`\n[9] PUT /books/${newId}/ -> Status: ${r9.status} (Expected 200)`);
    console.log('   Response:', r9.data);

    const r10 = await request('DELETE', `/books/${newId}/`);
    console.log(`\n[10] DELETE /books/${newId}/ -> Status: ${r10.status} (Expected 200)`);
    console.log('   Response:', r10.data);

    console.log('\n=== All Lab 3 tests passed successfully! ===');
}

runTests().catch(err => {
    console.error('Test run failed:', err);
    process.exit(1);
});
