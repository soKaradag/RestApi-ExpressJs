//Add packages
const express = require("express");
const router = express.Router();

// Function takes db and sets users routes.
function userRoutes(db) {
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
    router.get("/users/:id", (req, res) => {
        //Take id from user.
        const userId = req.params.id;

        //Take specific user from database acording to id.
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
