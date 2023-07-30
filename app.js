//Add packages
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");

//Create express app
const app = express();

// Middleware - Express JSON Parser
app.use(express.json());

//Server port
const HTTP_PORT = 3000;

//Start server
app.listen(HTTP_PORT, () => {
    console.log(`Serdar running on port ${HTTP_PORT}`);
});

//Define database
const db = new sqlite3.Database('.database.db');

//Create database
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)');
});

//Root endpoint
app.get("/", (req, res) => {
    res.json({"message": "Hello"})
});

//Add users routes
app.use("/users", userRoutes(db));

//Add auth routes
app.use("/register", authRoutes(db));

//Default response
app.use(function(req, res) {
    res.status(404);
    res.json({"message": "There is no file like that."})
});

