const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, 'books.db');
const PORT = process.env.PORT || 3000;

let db = null;

// Request logging middleware to log method, path, and response status
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
    });
    next();
});

// Task 3: initializeDBAndServer async function
const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        console.log('Database connected successfully at:', dbPath);

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}/`);
        });
    } catch (e) {
        console.error(`DB Error: ${e.message}`);
        process.exit(1);
    }
};

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to Lab 2: SQLite database and CRUD routes API',
        endpoints: [
            'GET /books/',
            'GET /books/:bookId/',
            'POST /books/',
            'PUT /books/:bookId/',
            'DELETE /books/:bookId/'
        ]
    });
});

// Route 1: GET /books/ - Get all books
app.get('/books/', async (req, res) => {
    try {
        const getBooksQuery = `
            SELECT *
            FROM book
            ORDER BY id;
        `;
        const booksArray = await db.all(getBooksQuery);
        res.status(200).json(booksArray);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route 2: GET /books/:bookId/ - Get specific book by ID
app.get('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;
        const getBookQuery = `
            SELECT *
            FROM book
            WHERE id = ?;
        `;
        const book = await db.get(getBookQuery, [bookId]);

        if (!book) {
            return res.status(404).json({ error: `Book with id ${bookId} not found` });
        }
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route 3: POST /books/ - Add a new book
app.post('/books/', async (req, res) => {
    try {
        const { title, author, price, pages } = req.body;

        if (!title || !author || price === undefined || pages === undefined) {
            return res.status(400).json({
                error: 'Please provide all required fields: title, author, price, and pages.'
            });
        }

        const addBookQuery = `
            INSERT INTO book (title, author, price, pages)
            VALUES (?, ?, ?, ?);
        `;
        const dbResponse = await db.run(addBookQuery, [title, author, price, pages]);

        res.status(201).json({
            message: 'Book Added Successfully',
            bookId: dbResponse.lastID
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route 4: PUT /books/:bookId/ - Update an existing book
app.put('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;
        const { title, author, price, pages } = req.body;

        // Verify book exists
        const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
        const existingBook = await db.get(checkBookQuery, [bookId]);

        if (!existingBook) {
            return res.status(404).json({ error: `Book with id ${bookId} not found` });
        }

        const updatedTitle = title !== undefined ? title : existingBook.title;
        const updatedAuthor = author !== undefined ? author : existingBook.author;
        const updatedPrice = price !== undefined ? price : existingBook.price;
        const updatedPages = pages !== undefined ? pages : existingBook.pages;

        const updateBookQuery = `
            UPDATE book
            SET
                title = ?,
                author = ?,
                price = ?,
                pages = ?
            WHERE id = ?;
        `;
        await db.run(updateBookQuery, [
            updatedTitle,
            updatedAuthor,
            updatedPrice,
            updatedPages,
            bookId
        ]);

        res.status(200).json({
            message: 'Book Updated Successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route 5: DELETE /books/:bookId/ - Delete a book
app.delete('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;

        // Verify book exists
        const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
        const existingBook = await db.get(checkBookQuery, [bookId]);

        if (!existingBook) {
            return res.status(404).json({ error: `Book with id ${bookId} not found` });
        }

        const deleteBookQuery = `
            DELETE FROM book
            WHERE id = ?;
        `;
        await db.run(deleteBookQuery, [bookId]);

        res.status(200).json({
            message: 'Book Deleted Successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Handle 404 for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: '404 - Endpoint Not Found' });
});

// Auto-start server when run directly
if (require.main === module) {
    initializeDBAndServer();
}

module.exports = { app, initializeDBAndServer };
