const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const methodOverride = require('method-override');
const session = require('express-session');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./db/inventory.db');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(
    session({
        secret: 'your-secret-key', // Replace with a secure key in production
        resave: false,
        saveUninitialized: true
    })
);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Ensure user is logged in before accessing the dashboard
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect to login if user is not logged in
    }

    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).send(err.message);
        res.render('index', { products: rows });
    });
});

// Login route
app.get('/login', (req, res) => {
    res.render('login', { errorMessage: null }); // Render the login form
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Hardcoded user (for demonstration purposes)
    const user = {
        username: 'admin',
        password: 'admin' // Plaintext password
    };

    // Check if the username matches
    if (username === user.username) {
        // Directly compare the plaintext password
        if (password === user.password) {
            req.session.user = user; // Store user info in the session
            res.redirect('/'); // Redirect to the main page (inventory)
        } else {
            res.render('login', { errorMessage: 'Invalid password' }); // Show error if password is incorrect
        }
    } else {
        res.render('login', { errorMessage: 'Invalid username' }); // Show error if username is incorrect
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Error logging out');
        }
        res.redirect('/login'); // Redirect to the login page
    });
});

// Routes for managing products
app.get('/products/new', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('new');
});

app.post('/products', (req, res) => {
    const { name, description, price, quantity } = req.body;
    db.run(
        "INSERT INTO products (name, description, price, quantity) VALUES (?, ?, ?, ?)",
        [name, description, price, quantity],
        (err) => {
            if (err) return res.status(500).send(err.message);
            res.redirect('/');
        }
    );
});

app.get('/products/:id/edit', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { id } = req.params;
    db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
        if (err) return res.status(500).send(err.message);
        res.render('edit', { product });
    });
});

app.put('/products/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { id } = req.params;
    const { name, description, price, quantity } = req.body;
    db.run(
        "UPDATE products SET name = ?, description = ?, price = ?, quantity = ? WHERE id = ?",
        [name, description, price, quantity, id],
        (err) => {
            if (err) return res.status(500).send(err.message);
            res.redirect('/');
        }
    );
});

app.delete('/products/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { id } = req.params;
    db.run("DELETE FROM products WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).send(err.message);
        res.redirect('/');
    });
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
