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

        const currentDate = new Date();
        const dateString = currentDate.toISOString();

        db.run('INSERT INTO posts (userid, username, title, content, createdAt) VALUES (?,?,?,?,?)', [req.currentUserId, req.currentusername, title, content, dateString], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'An error occurred while adding the post to the database' });
            }

            res.json({ message: "Post added successfully" });
            console.log("post added successfuly");
            console.log(`tabi: ${dateString}`)
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

    //Get posts and post's likes
    router.get("/", (req, res) => {
        db.all(`
            SELECT
                posts.id AS post_id,
                posts.title AS post_title,
                posts.content AS post_content,
                posts.userid AS post_userid,
                posts.username AS post_username,
                posts.createdAt AS post_createdAt,
                likes.id AS like_id,
                likes.userid AS like_userid,
                likes.username AS like_username,
                likes.createdAt AS like_createdAt
            FROM posts
            LEFT JOIN likes ON posts.id = likes.postid
        `, (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Veritabanından veriler alınırken bir hata oluştu", details: err.message });
            }

            if (rows.length > 0) {
                //Create an array for process each post
                const postsWithLikes = [];

                // Pick first post and assign to temporary variable
                let currentPost = {
                    post_id: rows[0].post_id,
                    post_title: rows[0].post_title,
                    post_content: rows[0].post_content,
                    post_userid: rows[0].post_userid,
                    post_username: rows[0].post_username,
                    post_createdAt: rows[0].post_createdAt,
                    likes: []
                };

                // Loop over Rows and commit each row
                rows.forEach(row => {
                    // If the post_id of the current post and the row being processed is not the same, it means you have moved on to the next post.
                    if (row.post_id !== currentPost.post_id) {
                        postsWithLikes.push(currentPost);

                        // Create a new post and update the temporary variable
                        currentPost = {
                            post_id: row.post_id,
                            post_title: row.post_title,
                            post_content: row.post_content,
                            post_userid: row.post_userid,
                            post_username: row.post_username,
                            post_createdAt: row.post_createdAt,
                            likes: []
                        };
                    }

                    // Add the like information on this line to the "likes" array of the current post
                    if (row.like_id !== null) {
                        currentPost.likes.push({
                            like_id: row.like_id,
                            like_userid: row.like_userid,
                            like_username: row.like_username,
                            like_createdAt: row.like_createdAt
                        });
                    }
                });

                // Add the last post to the postsWithLikes array
                postsWithLikes.push(currentPost);

                res.json(postsWithLikes);
                console.log("post fetched")
            } else {
                res.status(404).json({ message: 'Post cant find.' });
            }
        });
    });

    //Get specific user's posts and post's likes
    router.get("/:userid/posts", (req, res) => {
        const userid = req.params.userid;
        
        db.all(`
            SELECT
            posts.id AS post_id,
            posts.title AS post_title,
            posts.content AS post_content,
            posts.userid AS post_userid,
            posts.username AS post_username,
            posts.createdAt AS post_createdAt,
            likes.id AS like_id,
            likes.userid AS like_userid,
            likes.username AS like_username,
            likes.createdAt AS like_createdAt
        FROM posts
        LEFT JOIN likes ON posts.id = likes.postid
        WHERE posts.userid = ?;
        `, userid, (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Veritabanından veriler alınırken bir hata oluştu", details: err.message });
            }

            if (rows.length > 0) {
                //Create an array for process each post
                const postsWithLikes = [];

                // Pick first post and assign to temporary variable
                let currentPost = {
                    post_id: rows[0].post_id,
                    post_title: rows[0].post_title,
                    post_content: rows[0].post_content,
                    post_userid: rows[0].post_userid,
                    post_username: rows[0].post_username,
                    post_createdAt: rows[0].post_createdAt,
                    likes: []
                };

                // Loop over Rows and commit each row
                rows.forEach(row => {
                    // If the post_id of the current post and the row being processed is not the same, it means you have moved on to the next post.
                    if (row.post_id !== currentPost.post_id) {
                        postsWithLikes.push(currentPost);

                        // Create a new post and update the temporary variable
                        currentPost = {
                            post_id: row.post_id,
                            post_title: row.post_title,
                            post_content: row.post_content,
                            post_userid: row.post_userid,
                            post_username: row.post_username,
                            post_createdAt: row.post_createdAt,
                            likes: []
                        };
                    }

                    // Add the like information on this line to the "likes" array of the current post
                    if (row.like_id !== null) {
                        currentPost.likes.push({
                            like_id: row.like_id,
                            like_userid: row.like_userid,
                            like_username: row.like_username,
                            like_createdAt: row.like_createdAt
                        });
                    }
                });

                // Add the last post to the postsWithLikes array
                postsWithLikes.push(currentPost);

                res.json(postsWithLikes);
                console.log("post fetched")
            } else {
                res.status(404).json({ message: 'Post cant find.' });
            }
        });
    });


    //Search post in database
    router.post("/search", (req, res) => {
        // Take search key
        const searchTerm = req.body.searchTerm;
        console.log(`Trying to search ${searchTerm}`)

        // Make search in database according to key
        db.all('SELECT id, title, content, userid, username FROM posts WHERE title LIKE ?', [`%${searchTerm}%`], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'An error occurred while searching for posts', details: err.message });
            } else {
                res.json(rows);
            }
        });
    });

    return router;
}

module.exports = postRoutes;