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

    //Add Comment
    router.post("/addComment", (req, res) =>  {
        // Take input from user
        const { postid, content } = req.body;
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log("trying to add comment")
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
        if (!req.currentUserId || !req.currentusername || !postid || !content) {
            return res.status(400).json({ error: 'User ID, username and postid are required' });
        }

        // Fetch current date and transform to string
        const currentDate = new Date();
        const dateString = currentDate.toISOString();
        console.log("trying to add comment")
        db.run('INSERT INTO comments (userid, username, postid, createdAt, content) VALUES (?,?,?,?,?)', [req.currentUserId, req.currentusername, postid, dateString, content], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred while adding the post to the database' });
            }

            console.log("trying to add comment succes")
            const addedComment = {
                userid: req.currentUserId,
                username: req.currentusername,
                postid: postid,
                createdAt: dateString,
                content: content
            };
            console.log("comment:", JSON.stringify(addedComment));
            res.json({ message: "Comment added successfully" });
        });
    });

    //Delete Comment
    router.delete("/deleteComment", (req, res) => {
        const commentId = req.params.commentid;
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

        // Check if the comment exists and get its owner ID
        db.get('SELECT userid, postid FROM comments WHERE id = ?', [commentId], (err, comment) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "An error occurred while fetching the comment from the database", details: err.message });
            }

            if (!comment) {
                return res.status(404).json({ error: "Comment not found" });
            }

            // Check if the comment belongs to the user or if it's on the user's post
            if (comment.userid !== req.currentUserId) {
                // Comment doesn't belong to the user, check if it's on the user's post
                db.get('SELECT userid FROM posts WHERE id = ?', [comment.postid], (err, post) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ error: "An error occurred while fetching the post from the database", details: err.message });
                    }

                    if (!post) {
                        return res.status(404).json({ error: "Post not found" });
                    }

                    if (post.userid !== req.currentUserId) {
                        // Comment is neither the user's nor on the user's post
                        return res.status(403).json({ error: "You are not authorized to delete this comment" });
                    }

                    // Delete the comment from the database
                    db.run('DELETE FROM comments WHERE id = ?', commentId, (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ error: "An error occurred while deleting the comment from the database", details: err.message });
                        }

                        res.json({ message: "Comment deleted successfully" });
                    });
                });
            } else {
                // Comment belongs to the user, they can delete it
                // Delete the comment from the database
                db.run('DELETE FROM comments WHERE id = ?', commentId, (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: "An error occurred while deleting the comment from the database", details: err.message });
                    }

                    res.json({ message: "Comment deleted successfully" });
                });
            }
        });
    });


    return router;

}

module.exports = commentRoutes;