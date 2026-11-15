const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const dbPath = path.join(__dirname, 'userData.db');

async function initializeDatabase() {
    try {
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }

        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        const sql = fs.readFileSync(path.join(__dirname, 'setup.sql'), 'utf-8');
        await db.exec(sql);

        const defaultHashedPassword = await bcrypt.hash('secretPass123', 10);
        await db.run(
            `INSERT INTO user (username, name, password, gender, location) VALUES (?, ?, ?, ?, ?);`,
            ['john_doe', 'John Doe', defaultHashedPassword, 'Male', 'Hyderabad']
        );

        const users = await db.all('SELECT id, username, name, password, gender, location FROM user;');
        console.log(`Database initialized with ${users.length} user(s):`);
        console.table(users);

        await db.close();
        console.log('Database initialization completed.');
    } catch (error) {
        console.error('Error initializing database:', error.message);
        process.exit(1);
    }
}

initializeDatabase();
