const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, 'books.db');
const PORT = process.env.PORT || 3000;

let db = null;

// Request logging middleware to log method, path, query and response status
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
    });
    next();
});

// Database & Server initialization
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

// Root route - API index
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to Lab 3: REST API, query parameters, validation, and debugging',
        endpoints: [
            'GET /books/?search_q=&order_by=&order=&limit=&offset=&min_price=&max_price=',
            'GET /books/:bookId/',
            'POST /books/',
            'PUT /books/:bookId/',
            'DELETE /books/:bookId/'
        ]
    });
});

// Route 1: GET /books/ - Search, sort, price-filter, and pagination
app.get('/books/', async (req, res) => {
    try {
        const {
            search_q = '',
            order_by = 'id',
            order = 'ASC',
            limit = 10,
            offset = 0,
            min_price,
            max_price
        } = req.query;

        // Validation for order_by column whitelist to prevent SQL injection
        const allowedColumns = ['id', 'title', 'author', 'price', 'pages'];
        const safeOrderBy = allowedColumns.includes(order_by.toLowerCase())
            ? order_by.toLowerCase()
            : 'id';

        // Validation for sort direction
        const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Safe integer parsing for limit and offset
        const safeLimit = Math.max(1, parseInt(limit, 10) || 10);
        const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

        // Build WHERE clauses dynamically using ? placeholders
        const whereClauses = ['title LIKE ?'];
        const queryParams = [`%${search_q}%`];

        if (min_price !== undefined && max_price !== undefined) {
            const min = Number(min_price);
            const max = Number(max_price);
            if (isNaN(min) || isNaN(max)) {
                return res.status(400).json({ message: 'min_price and max_price must be numeric' });
            }
            whereClauses.push('price BETWEEN ? AND ?');
            queryParams.push(min, max);
        } else if (min_price !== undefined) {
            const min = Number(min_price);
            if (isNaN(min)) {
                return res.status(400).json({ message: 'min_price must be numeric' });
            }
            whereClauses.push('price >= ?');
            queryParams.push(min);
        } else if (max_price !== undefined) {
            const max = Number(max_price);
            if (isNaN(max)) {
                return res.status(400).json({ message: 'max_price must be numeric' });
            }
            whereClauses.push('price <= ?');
            queryParams.push(max);
        }

        const getBooksQuery = `
            SELECT *
            FROM book
            WHERE ${whereClauses.join(' AND ')}
            ORDER BY ${safeOrderBy} ${safeOrder}
            LIMIT ? OFFSET ?;
        `;
        queryParams.push(safeLimit, safeOffset);

        const books = await db.all(getBooksQuery, queryParams);
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route 2: GET /books/:bookId/ - Single book lookup
app.get('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;
        const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
        const book = await db.get(getBookQuery, [bookId]);

        if (!book) {
            return res.status(404).json({ message: `Book with ID ${bookId} not found` });
        }
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route 3: POST /books/ - Add book with strict payload validation
app.post('/books/', async (req, res) => {
    try {
        const { title, author, price, pages } = req.body;

        // Validation: title and author must be non-empty strings
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ message: 'Invalid or missing title. Title must be a non-empty string.' });
        }

        if (!author || typeof author !== 'string' || author.trim() === '') {
            return res.status(400).json({ message: 'Invalid or missing author. Author must be a non-empty string.' });
        }

        // Validation: price must be numeric and non-negative
        if (price === undefined || price === null || typeof price !== 'number' || isNaN(price) || price < 0) {
            return res.status(400).json({ message: 'Invalid or missing price. Price must be a valid non-negative number.' });
        }

        // Validation: pages must be an integer >= 1
        if (pages === undefined || pages === null || typeof pages !== 'number' || !Number.isInteger(pages) || pages < 1) {
            return res.status(400).json({ message: 'Invalid or missing pages. Pages must be a positive integer.' });
        }

        const addBookQuery = `
            INSERT INTO book (title, author, price, pages)
            VALUES (?, ?, ?, ?);
        `;
        const dbResponse = await db.run(addBookQuery, [title.trim(), author.trim(), price, pages]);

        res.status(201).json({
            message: 'Book Added Successfully',
            bookId: dbResponse.lastID
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route 4: PUT /books/:bookId/ - Update an existing book with validation
app.put('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;
        const { title, author, price, pages } = req.body;

        const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
        const existingBook = await db.get(checkBookQuery, [bookId]);

        if (!existingBook) {
            return res.status(404).json({ message: `Book with ID ${bookId} not found` });
        }

        // Validate optional update fields
        if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
            return res.status(400).json({ message: 'Title must be a non-empty string.' });
        }
        if (author !== undefined && (typeof author !== 'string' || author.trim() === '')) {
            return res.status(400).json({ message: 'Author must be a non-empty string.' });
        }
        if (price !== undefined && (typeof price !== 'number' || isNaN(price) || price < 0)) {
            return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
        }
        if (pages !== undefined && (typeof pages !== 'number' || !Number.isInteger(pages) || pages < 1)) {
            return res.status(400).json({ message: 'Pages must be a positive integer.' });
        }

        const updatedTitle = title !== undefined ? title.trim() : existingBook.title;
        const updatedAuthor = author !== undefined ? author.trim() : existingBook.author;
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
        res.status(500).json({ message: error.message });
    }
});

// Route 5: DELETE /books/:bookId/ - Delete a book
app.delete('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;

        const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
        const existingBook = await db.get(checkBookQuery, [bookId]);

        if (!existingBook) {
            return res.status(404).json({ message: `Book with ID ${bookId} not found` });
        }

        const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
        await db.run(deleteBookQuery, [bookId]);

        res.status(200).json({
            message: 'Book Deleted Successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Wildcard 404 for unknown routes
app.use((req, res) => {
    res.status(404).json({ message: '404 - Endpoint Not Found' });
});

// Auto-start server when run directly
if (require.main === module) {
    initializeDBAndServer();
}

module.exports = { app, initializeDBAndServer };
