-- Lab 3: SQLite database setup
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price INTEGER NOT NULL,
    pages INTEGER NOT NULL
);

-- Seed 10 books
INSERT INTO book (title, author, price, pages) VALUES 
('To Kill a Mockingbird', 'Harper Lee', 399, 281),
('1984', 'George Orwell', 299, 328),
('The Great Gatsby', 'F. Scott Fitzgerald', 249, 180),
('Pride and Prejudice', 'Jane Austen', 199, 279),
('The Catcher in the Rye', 'J.D. Salinger', 350, 234),
('The Hobbit', 'J.R.R. Tolkien', 450, 310),
('Brave New World', 'Aldous Huxley', 320, 268),
('Crime and Punishment', 'Fyodor Dostoevsky', 499, 671),
('The Alchemist', 'Paulo Coelho', 250, 208),
('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 550, 443);
