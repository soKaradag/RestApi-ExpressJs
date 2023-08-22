//Add packages
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const likeRoutes = require("./routes/likes");
const commentRoutes = require("./routes/comments");
const limiter = require('./security/rateLimit');
const jwt = require('./security/jwt');
const { verifyJWT } = require('./security/jwt');


//Create express app
const app = express();


// Middleware - Express JSON Parser
app.use(express.json());

//Server port
const HTTP_PORT = 3000;

//Start server
app.listen(HTTP_PORT, () => {
    console.log(`Server running on port ${HTTP_PORT}`);
});

//Define database
const db = new sqlite3.Database('.database.db');

//Create database
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, userid INTEGER, username TEXT, title TEXT, content TEXT, createdAt TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS onlines (userid INTEGER, username TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS likes (postid INTEGER, userid INTEGER, username TEXT, createdAt TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, postid INTEGER, userid INTEGER, username TEXT, content TEXT, createdAt TEXT)');
});


//Add users routes
app.use("/users", userRoutes(db, verifyJWT));

//Add auth routes
app.use("/auth", authRoutes(db, verifyJWT));

//Add post routes
app.use("/posts", postRoutes(db, verifyJWT));

//Add like routes
app.use("/likes", likeRoutes(db, verifyJWT));


//Default response
app.use(function (req, res) {
    res.status(404);
    res.json({ "message": "There is no file like that." })
});

