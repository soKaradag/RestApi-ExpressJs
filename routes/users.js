//Add packages
const express = require("express");
const router = express.Router();
const verifyApiKey = require('../security/apiKey');


// Function takes db and sets users routes.
function userRoutes(db, verifyJWT) {
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

    //Get all users
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

    //Delete user
    router.post('/:id', (req, res) => {
        console.log('Received delete request');

        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log(`token: ${token}`);
        if (!token) {
            return res.status(401).json({ error: 'Authorization token not provided' });
        }

        const decodedToken = verifyJWT(token);
        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Add user ID to the request object
        req.userid = decodedToken.id;
        console.log("User ID from decoded token:", req.userid);

        // Delete user from users
        db.run('DELETE FROM users WHERE id = ?', [req.userid], (err) => { // <-- Use 'req.userid' here
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred while removing the user from onlines' });
            }

            console.log(`User ${req.userid} has been deleted`);
            res.json({ message: `User ${req.userid} has been deleted.` });
        });
    });

    // Return new updated route items.
    return router;
}

module.exports = userRoutes;
