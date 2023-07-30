//Add packages
const express = require("express")
const sqlite3 = require("sqlite3").verbose()

//Create express app
const app = express();

//Server port
var HTTP_PORT = 3000

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

//Users endpoint
app.get("/users", (req, res) => {
    db.all('SELECT id, username FROM users', (err, rows) => {
        if (err) {
            console.error(err)
        } else {
            res.json(rows);
        }
    });
});

//Default response
app.use(function(req, res) {
    res.status(404);
    res.json({"message": "There is no file like that."})
});

