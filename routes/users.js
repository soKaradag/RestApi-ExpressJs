//Add packages
const express = require("express");
const router = express.Router();
const verifyApiKey = require('../security/apiKey');
const verifyApiKey = require('../security/apiKey');

// Function takes db and sets users routes.
function userRoutes(db) {
    //Check for api key
    router.use(verifyApiKey);

    // Verify JWT token
    router.use((req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authorization token not provided' });
        }

        const decodedToken = verifyJWT(token);
        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Add user ID to the request object
        req.userid = decodedToken.id;
        next();
    });

    //Users endpoint
    router.get("/", (req, res) => {
        db.all('SELECT id, username FROM users', (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'An error occurred while retrieving data from the database', details: err.message });
            } else {
                res.json(rows);
            }
        });
    });

    //Get specific user from database
    router.get("/:id", (req, res) => {
        const userId = req.params.id;
        db.get('SELECT id, username FROM users WHERE id = ?', userId, (err, row) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'An error occurred while retrieving data from the database', details: err.message });
            } else {
                if (row) {
                    res.json(row);
                } else {
                    res.status(404).json({ message: 'User not found' });
                }
            }
        });
    });

    // Return new updated route items.
    return router;
}

module.exports = userRoutes;
