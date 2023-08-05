//Add packages
const express = require("express");
const verifyApiKey = require('../security/apiKey');
const router = express.Router();
const jwt = require('../security/jwt');
const verifyJWT = jwt.verifyJWT;

// Function takes db and sets post routes.
function postRoutes(db) {
    //Verify api key
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

    //Add post
    router.post("/addPost", (req, res) => {
        const { userid, title, content } = req.body;

        if (!userid || !title || !content) {
            return res.status(400).json({ error: 'User ID, title, and content are required' });
        }

        if (req.userid !== userid) {
            return res.status(403).json({ error: 'You are not authorized to create a post for another user' });
        }

        db.run('INSERT INTO posts (userid, title, content) VALUES (?,?,?)', [userid, title, content], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred while adding the post to the database' });
            }

            res.json({ message: "Post added successfully" });
        });

    });

    //Delete post

    //Get all posts

    //Get specific post

    return router;
}

module.exports = postRoutes;