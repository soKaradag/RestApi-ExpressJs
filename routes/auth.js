//Add packages
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

// Function takes db and sets auth routes.
function authRoutes(db) {
    //Register endpoint
    router.post("/register", (req, res) => {
        //Take input from user
        const {username, password} = req.body;

        //Hashing password with bcrypt and add to database
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred while hashing the password' });
            }

            //Add new user into database
            db.run('INSERT INTO users (username, password) VALUES (?,?)', [username, hashedPassword], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'An error occurred while adding the user to the database' });
                }
                
                res.json({message: "User registered successfully."});
            });
        });
    });

    return router;
}

module.exports = authRoutes;