//Add packages
const express = require("express");
const verifyApiKey = require('../security/apiKey');
const router = express.Router();
const jwt = require('../security/jwt');

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
    router.delete("/deletePost", (req, res) => {
        const postId = req.body.id;
        const currentUserId = req.authData.id;

        // Check if the post exists and get its owner ID
        db.get('SELECT userid FROM posts WHERE id = ?', postId, (err, post) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "An error occurred while fetching the post from the database", details: err.message });
            }

            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }

            if (post.userid !== currentUserId) {
                return res.status(403).json({ error: "You are not authorized to delete this post" });
            }

            // Delete the post from the database
            db.run('DELETE FROM posts WHERE id = ?', postId, (err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: "An error occurred while deleting the post from the database", details: err.message });
                }

                res.json({ message: "Post deleted successfully" });
            });
        });
    });


    //Get all posts

    //Get specific post

    return router;
}

module.exports = postRoutes;