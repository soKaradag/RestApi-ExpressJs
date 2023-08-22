//Add packages
const express = require("express");
const verifyApiKey = require('../security/apiKey');
const router = express.Router();

//Create comment routes
function commentRoutes(db, verifyJWT) {
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

    //Fetch specific post's comments
    router.get("/:postid/comments", (req, res) => {
        const postid = req.params.postid;
    
        // Call comments of a specific post from the database by postid
        db.all('SELECT * FROM comments WHERE postid = ?', postid, (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "An error occurred while fetching posts's comments from the database", details: err.message });
            }
            res.json(row);
        });
    }); 

    //Add Comment
    router.post("/addComment", (req, res) =>  {
        // Take input from user
        const { postid, content } = req.body;
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

        // Fetch current date and transform to string
        const currentDate = new Date();
        const dateString = currentDate.toISOString();

        db.run('INSERT INTO comments (userid, username, postid, createdAt, content) VALUES (?,?,?,?,?)', [req.currentUserId, req.currentusername, postid, dateString, content], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred while adding the post to the database' });
            }

            res.json({ message: "Like added successfully" });
        });
    });

}