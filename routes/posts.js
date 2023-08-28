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

    router.get("/", (req, res) => {
        db.all(`
            SELECT
                posts.id AS post_id,
                posts.title AS post_title,
                posts.content AS post_content,
                posts.userid AS post_userid,
                posts.username AS post_username,
                posts.createdAt AS post_createdAt
            FROM posts
        `, (err, postRows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Veritabanından gönderiler alınırken bir hata oluştu", details: err.message });
            }
    
            if (postRows.length === 0) {
                return res.status(404).json({ message: 'Gönderi bulunamadı' });
            }
    
            // Tüm postları tutacak bir dizi oluştur
            const postsWithLikesAndComments = [];
    
            // Postları işle
            postRows.forEach(postRow => {
                const post = {
                    post_id: postRow.post_id,
                    post_title: postRow.post_title,
                    post_content: postRow.post_content,
                    post_userid: postRow.post_userid,
                    post_username: postRow.post_username,
                    post_createdAt: postRow.post_createdAt,
                    likes: [], // Her postun beğenilerini tutacak dizi
                    comments: [] // Her postun yorumlarını tutacak dizi
                };
    
                // Beğenileri al ve ilgili postun beğeniler dizisine ekle
                db.all(`
                    SELECT
                        likes.id AS like_id,
                        likes.userid AS like_userid,
                        likes.username AS like_username,
                        likes.createdAt AS like_createdAt
                    FROM likes
                    WHERE likes.postid = ?
                `, [post.post_id], (likeErr, likeRows) => {
                    if (!likeErr) {
                        post.likes = likeRows;
                    }
    
                    // Yorumları al ve ilgili postun yorumlar dizisine ekle
                    db.all(`
                        SELECT
                            comments.id AS comment_id,
                            comments.userid AS comment_userid,
                            comments.username AS comment_username,
                            comments.content AS comment_content,
                            comments.createdAt AS comment_createdAt
                        FROM comments
                        WHERE comments.postid = ?
                    `, [post.post_id], (commentErr, commentRows) => {
                        if (!commentErr) {
                            post.comments = commentRows;
                        }
    
                        // Her şey tamamlandığında post'u ana diziye ekle
                        postsWithLikesAndComments.push(post);
    
                        // Tüm postlar işlendiğinde sonucu gönder
                        if (postsWithLikesAndComments.length === postRows.length) {
                            res.json(postsWithLikesAndComments);
                        }
                    });
                });
            });
        });
    });

    
    router.get("/:userid/posts", (req, res) => {
        const userid = req.params.userid;

        db.all(`
            SELECT
                posts.id AS post_id,
                posts.title AS post_title,
                posts.content AS post_content,
                posts.userid AS post_userid,
                posts.username AS post_username,
                posts.createdAt AS post_createdAt
            FROM posts
            WHERE posts.userid = ?;
        `,userid, (err, postRows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Veritabanından gönderiler alınırken bir hata oluştu", details: err.message });
            }
    
            if (postRows.length === 0) {
                return res.status(404).json({ message: 'Gönderi bulunamadı' });
            }
    
            // Tüm postları tutacak bir dizi oluştur
            const postsWithLikesAndComments = [];
    
            // Postları işle
            postRows.forEach(postRow => {
                const post = {
                    post_id: postRow.post_id,
                    post_title: postRow.post_title,
                    post_content: postRow.post_content,
                    post_userid: postRow.post_userid,
                    post_username: postRow.post_username,
                    post_createdAt: postRow.post_createdAt,
                    likes: [], // Her postun beğenilerini tutacak dizi
                    comments: [] // Her postun yorumlarını tutacak dizi
                };
    
                // Beğenileri al ve ilgili postun beğeniler dizisine ekle
                db.all(`
                    SELECT
                        likes.id AS like_id,
                        likes.userid AS like_userid,
                        likes.username AS like_username,
                        likes.createdAt AS like_createdAt
                    FROM likes
                    WHERE likes.postid = ?
                `, [post.post_id], (likeErr, likeRows) => {
                    if (!likeErr) {
                        post.likes = likeRows;
                    }
    
                    // Yorumları al ve ilgili postun yorumlar dizisine ekle
                    db.all(`
                        SELECT
                            comments.id AS comment_id,
                            comments.userid AS comment_userid,
                            comments.username AS comment_username,
                            comments.content AS comment_content,
                            comments.createdAt AS comment_createdAt
                        FROM comments
                        WHERE comments.postid = ?
                    `, [post.post_id], (commentErr, commentRows) => {
                        if (!commentErr) {
                            post.comments = commentRows;
                        }
    
                        // Her şey tamamlandığında post'u ana diziye ekle
                        postsWithLikesAndComments.push(post);
    
                        // Tüm postlar işlendiğinde sonucu gönder
                        if (postsWithLikesAndComments.length === postRows.length) {
                            res.json(postsWithLikesAndComments);
                        }
                    });
                });
            });
        });
    });

    router.post("/search", (req, res) => {
        const searchTerm = req.body.searchTerm;
        console.log("Gönderiler getirildi", JSON.stringify(searchTerm));
        db.all(`
            SELECT
                posts.id AS post_id,
                posts.title AS post_title,
                posts.content AS post_content,
                posts.userid AS post_userid,
                posts.username AS post_username,
                posts.createdAt AS post_createdAt
            FROM posts
            WHERE posts.title LIKE ?
        `,[`%${searchTerm}%`], (err, postRows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Veritabanından gönderiler alınırken bir hata oluştu", details: err.message });
            }
    
            if (postRows.length === 0) {
                return res.status(404).json({ message: 'Gönderi bulunamadı' });
            }
    
            // Tüm postları tutacak bir dizi oluştur
            const postsWithLikesAndComments = [];
    
            // Postları işle
            postRows.forEach(postRow => {
                const post = {
                    post_id: postRow.post_id,
                    post_title: postRow.post_title,
                    post_content: postRow.post_content,
                    post_userid: postRow.post_userid,
                    post_username: postRow.post_username,
                    post_createdAt: postRow.post_createdAt,
                    likes: [], // Her postun beğenilerini tutacak dizi
                    comments: [] // Her postun yorumlarını tutacak dizi
                };
    
                // Beğenileri al ve ilgili postun beğeniler dizisine ekle
                db.all(`
                    SELECT
                        likes.id AS like_id,
                        likes.userid AS like_userid,
                        likes.username AS like_username,
                        likes.createdAt AS like_createdAt
                    FROM likes
                    WHERE likes.postid = ?
                `, [post.post_id], (likeErr, likeRows) => {
                    if (!likeErr) {
                        post.likes = likeRows;
                    }
    
                    // Yorumları al ve ilgili postun yorumlar dizisine ekle
                    db.all(`
                        SELECT
                            comments.id AS comment_id,
                            comments.userid AS comment_userid,
                            comments.username AS comment_username,
                            comments.content AS comment_content,
                            comments.createdAt AS comment_createdAt
                        FROM comments
                        WHERE comments.postid = ?
                    `, [post.post_id], (commentErr, commentRows) => {
                        if (!commentErr) {
                            post.comments = commentRows;
                        }
    
                        // Her şey tamamlandığında post'u ana diziye ekle
                        postsWithLikesAndComments.push(post);
    
                        // Tüm postlar işlendiğinde sonucu gönder
                        if (postsWithLikesAndComments.length === postRows.length) {
                            res.json(postsWithLikesAndComments);
                        }
                    });
                });
            });
        });
    });

    


    return router;
}

module.exports = postRoutes;