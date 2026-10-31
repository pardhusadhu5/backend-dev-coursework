const path = require('path');
const fs = require('fs');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const dbPath = path.join(__dirname, 'books.db');

async function initializeDatabase() {
    try {
        // If books.db already exists, remove it for a clean re-initialization
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }

        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        console.log('Connected to SQLite database at:', dbPath);

        const sql = fs.readFileSync(path.join(__dirname, 'setup.sql'), 'utf-8');
        await db.exec(sql);

        const books = await db.all('SELECT * FROM book');
        console.log(`Successfully created table and inserted ${books.length} books:`);
        console.table(books);

        await db.close();
        console.log('Database initialization completed.');
    } catch (error) {
        console.error('Error initializing database:', error.message);
        process.exit(1);
    }
}

initializeDatabase();
