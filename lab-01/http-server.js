const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
    console.log(`[HTTP Server] ${req.method} ${req.url} - 200 OK`);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Hello');
});

server.listen(PORT, () => {
    console.log(`Plain HTTP server running at http://localhost:${PORT}`);
});
