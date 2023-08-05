//Add packages
const express = require("express");
const verifyApiKey = require('../security/apiKey');
const router = express.Router();

// Function takes db and sets post routes.
function postRoutes(db) {
    //Verify api key
    router.use(verifyApiKey);

    //Add post

    //Delete post

    //Get all posts

    //Get specific post

    return router;
}

module.exports = postRoutes;