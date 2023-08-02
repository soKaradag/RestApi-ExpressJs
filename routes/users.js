//Add packages
const express = require("express");
const router = express.Router();
const verifyApiKey = require('../security/apiKey');

// Function takes db and sets users routes.
function userRoutes(db) {
    //Check for api key
    router.use(verifyApiKey);
    
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
    })

    //Delete user
    router.delete("/:id", (req, res) => {
        const userId = req.params.id; //user want to delete
        const authUserId = req.authData.id; //currenUser

        //Check the currentUser and the user want to delete are same
        if (userId !== authUserId) {
            return res.status(403).json({ error: "You are not authorized to delete this user" });
        }

        db.run('DELETE FROM users WHERE id = ?', userId, (err) => {
            if (err) {
                console.log(err);
                res.status(500).json({error: "An arror uccurred while deleting the user from database", details: err.message});
            } else {
                res.json({message: "User deleted successfully"})
            }
        });
    });

    // Return new updated route items.
    return router; 
}

module.exports = userRoutes;
