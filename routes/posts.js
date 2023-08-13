//Add packages
const express = require("express");
const verifyApiKey = require('../security/apiKey');
const router = express.Router();

// Function takes db and sets post routes.
function postRoutes(db, verifyJWT) {
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
        const { title, content } = req.body;

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
        req.currentUserId = decodedToken.id;
        req.currentusername = decodedToken.username;
        console.log("User ID from decoded token:", req.currentUserId);
        console.log("User ID from decoded token:", req.currentusername);

        if (!req.currentUserId || !req.currentusername || !title || !content) {
            return res.status(400).json({ error: 'User ID, username, title, and content are required' });
        }

        db.run('INSERT INTO posts (userid, username, title, content) VALUES (?,?,?,?)', [req.currentUserId, req.currentusername, title, content], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred while adding the post to the database' });
            }

            res.json({ message: "Post added successfully" });
            console.log("post added successfuly");
        });

    });

    //Delete post
    router.delete("/:id", (req, res) => {
        const postId = req.params.id;

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
        req.currentUserId = decodedToken.id;
        console.log("User ID from decoded token:", req.currentUserId);

        // Check if the post exists and get its owner ID
        db.get('SELECT userid FROM posts WHERE id = ?', [postId], (err, post) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "An error occurred while fetching the post from the database", details: err.message });
            }

            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }

            if (post.userid !== req.currentUserId) {
                return res.status(403).json({ error: "You are not authorized to delete this post" });
            }

            // Delete the post from the database
            db.run('DELETE FROM posts WHERE id = ?', postId, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "An error occurred while deleting the post from the database", details: err.message });
                }

                res.json({ message: "Post deleted successfully" });
            });
        });
    });


    //Get all posts
    router.get("/", (_, res) => {
        db.all('SELECT id, title, content, userid, username FROM posts', (err, row) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'An error occurred while retrieving data from the database', details: err.message });
            } else {
                if (row) {
                    res.json(row);
                } else {
                    res.status(404).json({ message: 'Post not found' });
                }
            }
        });
    });

    //Get specific post
    router.get("/:id", (req,res) => {
        //Get post id
        const postid = req.params.id;

        //Call specific post from database by id
        db.get('SELECT * FROM posts WHERE id = ?', [postid], (err) => {
            //If there is an error
            if (err) {
                console.error(err);
                //Return error code as a response
                return res.status(500).json({ error: "An error occurred while fetching post from the database", details: err.message });
            }
            //If no error response successful message.
            res.json({ message: "Post fetched successfully" });
        });
    });

    //Get specific user's posts
    router.get("/:userid/posts", (req, res) => {
        const userid = req.params.userid;
    
        // Call posts of a specific user from the database by userid
        db.all('SELECT * FROM posts WHERE userid = ?', userid, (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "An error occurred while fetching user's posts from the database", details: err.message });
            }
            res.json(row); // Değiştirilen satır
        });
    });

    return router;
}

module.exports = postRoutes;