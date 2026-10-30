const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Logging middleware to log route requests and status codes
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
    });
    next();
});

// GET / - Welcome route
app.get('/', (req, res) => {
    res.status(200).send('Welcome to my Node.js and Express server!');
});

// GET /about - Return name and section as JSON
app.get('/about', (req, res) => {
    res.status(200).json({
        name: 'Pardhu Sadhu',
        section: 'CSE'
    });
});

// GET /time - Return current date and time
app.get('/time', (req, res) => {
    res.status(200).json({
        currentDateTime: new Date()
    });
});

// Handle unknown routes (404 Not Found)
app.use((req, res) => {
    res.status(404).send('404 - Page Not Found');
});

// Start the Express server
const server = app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}`);
});

module.exports = { app, server };
