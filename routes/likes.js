//Add packages
const express = require("express");
const verifyApiKey = require('../security/apiKey');
const router = express.Router();

// Function takes db and sets post routes.
function likeRoutes(db, verifyJWT) {
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

    //Fetch specific post's likes
    router.get("/:postid/likes", (req, res) => {
        const postid = req.params.postid;
    
        // Call likes of a specific post from the database by postid
        db.all('SELECT * FROM likes WHERE postid = ?', postid, (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "An error occurred while fetching user's posts from the database", details: err.message });
            }
            res.json(row);
        });
    });

    //Add Likes
    router.post("/addLike", (req, res) =>  {
        // Take input from user
        const postid = req.body.postid;
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // Check token is empty
        if (!token) {
            return res.status(401).json({ error: 'Authorization token not provided' });
        }

        // Verify token
        const decodedToken = verifyJWT(token);
        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Add user ID to the request object from decoded token
        req.currentUserId = decodedToken.id;
        req.currentusername = decodedToken.username;

        // Input validation
        if (!req.currentUserId || !req.currentusername || !postid) {
            return res.status(400).json({ error: 'User ID, username and postid are required' });
        }

        // Check if the user has already liked the post
        db.get('SELECT * FROM likes WHERE userid = ? AND postid = ?', [req.currentUserId, postid], (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred while checking for existing likes' });
            }

            if (row) {
                // User has already liked the post
                return res.status(400).json({ error: 'User has already liked the post' });
            }

            // Fetch current date and transform to string
            const currentDate = new Date();
            const dateString = currentDate.toISOString();

            db.run('INSERT INTO likes (userid, username, postid, createdAt) VALUES (?,?,?,?)', [req.currentUserId, req.currentusername, postid, dateString], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'An error occurred while adding the post to the database' });
                }

                res.json({ message: "Like added successfully" });
            });
        });
    });

    //Delete Like
    router.delete("/deleteLike", (req, res) => {
        // Take input from user
        const postid = req.body.postid;
        const token = req.header('Authorization')?.replace('Bearer ', '');
    
        // Check token is empty
        if (!token) {
            return res.status(401).json({ error: 'Authorization token not provided' });
        }
    
        // Verify token
        const decodedToken = verifyJWT(token);
        if (!decodedToken) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    
        // Add user ID to the request object from decoded token
        req.currentUserId = decodedToken.id;
        req.currentusername = decodedToken.username;
    
        // Input validation
        if (!req.currentUserId || !req.currentusername || !postid) {
            return res.status(400).json({ error: 'User ID, username, and postid are required' });
        }
    
        // Check if the like exists and get its owner ID
        db.get('SELECT userid, postid FROM likes WHERE postid = ?', [postid], (err, like) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "An error occurred while fetching the likes from the database", details: err.message });
            }
    
            if (!like) {
                return res.status(404).json({ error: "Like not found" });
            }
    
            if (like.userid !== req.currentUserId) {
                return res.status(403).json({ error: "You are not authorized to delete this like" });
            }
    
            // Delete the like from the database
            db.run('DELETE FROM likes WHERE postid = ?', [postid], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "An error occurred while deleting the like from the database", details: err.message });
                }
    
                res.json({ message: "Like deleted successfully" });
            });
        });
    });


    //Return new updated route items.
    return router;

}

module.exports = likeRoutes;