const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, 'userData.db');
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'MY_SECRET_TOKEN';

let db = null;

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
    });
    next();
});

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        console.log('Connected to SQLite Database at:', dbPath);

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}/`);
        });
    } catch (e) {
        console.error(`DB Error: ${e.message}`);
        process.exit(1);
    }
};

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to Lab 4: Registration, Login and JWT Authentication API',
        endpoints: [
            'POST /register/',
            'POST /login/'
        ]
    });
});

app.post('/register/', async (req, res) => {
    try {
        const { username, name, password, gender = '', location = '' } = req.body;

        if (!username || !name || !password) {
            return res.status(400).json({ message: 'username, name, and password are required' });
        }

        const selectUserQuery = `SELECT * FROM user WHERE username = ?;`;
        const dbUser = await db.get(selectUserQuery, [username]);

        if (dbUser !== undefined) {
            return res.status(400).json({ message: 'User already exists' });
        }

        if (password.length < 5) {
            return res.status(400).json({ message: 'Password is too short' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const createUserQuery = `
            INSERT INTO user (username, name, password, gender, location)
            VALUES (?, ?, ?, ?, ?);
        `;
        await db.run(createUserQuery, [username, name, hashedPassword, gender, location]);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/login/', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'username and password are required' });
        }

        const selectUserQuery = `SELECT * FROM user WHERE username = ?;`;
        const dbUser = await db.get(selectUserQuery, [username]);

        if (dbUser === undefined) {
            return res.status(400).json({ message: 'Invalid user' });
        }

        const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

        if (!isPasswordMatched) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const payload = { username: dbUser.username };
        const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

        res.status(200).json({ jwt_token: jwtToken });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.use((req, res) => {
    res.status(404).json({ message: '404 - Endpoint Not Found' });
});

if (require.main === module) {
    initializeDBAndServer();
}

module.exports = { app, initializeDBAndServer, JWT_SECRET };
