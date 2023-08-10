//Add packages
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require('../security/jwt');
const verifyApiKey = require('../security/apiKey');

// Function takes db and sets auth routes.
function authRoutes(db) {
    //Check for api key
    router.use(verifyApiKey);

    //Register endpoint
    router.post("/register", (req, res) => {
        //Take input from user
        const { username, password } = req.body;

        // Check if the username and password are provided
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

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

                res.json({ message: "User registered successfully." });
            });
        });
    });

    //Login and create jwt
    router.post("/login", (req, res) => {
        const { username, password } = req.body;

        // Check if the user exists in the database
        db.get('SELECT id, username, password FROM users WHERE username = ?', username, (err, user) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred while retrieving user data from the database' });
            }

            // Check if the user with the given username exists
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            // Check if the password is correct
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'An error occurred while comparing passwords' });
                }

                if (!isMatch) {
                    return res.status(401).json({ error: 'Invalid password' });
                }

                //If auth is successful, create jwt
                const payload = { id: user.id, username: user.username }; //JWT content
                const token = jwt.generateJWT(payload);
                console.log("User logged in successfully.")

                //Return jwt
                res.json({ token: token });

                //Add users to the onlines when they are logged in.
                db.run('INSERT INTO onlines(userid, username) VALUES (?,?)', [user.id, username], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'An error occurred while adding the user to the onlines' });
                    }
    
                    console.log(`User ${username} added to onlines.`);
                });
                
            });
        });
    });

    // Middleware for verifying JWT token
    function verifyToken(req, res, next) {
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
    }

    //Logout function
    router.post("/logout", verifyToken, (req, res) => {
        //Get user info
        const {userid} = req.body;

        //Delete user from onlines
        db.run('DELETE FROM onlines WHERE userid = ?', [userid], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred while removing the user from onlines' });
            }
    
            console.log(`User ${username} has been logged out and removed from onlines.`);
            res.json({ message: `User ${username} has been logged out.` });
        });
    });

    //Return new updated route items.
    return router;
}

module.exports = authRoutes;