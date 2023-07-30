//Add packages
const jwt = require('jsonwebtoken');
const config = require('../config');

//Function for create JWT
function generateJWT(payload) {
    return jwt.sign(payload, config.secretKey, {expiresIn: "1d"});
}

//Function for JWT verification
function verifyJWT(token) {
    try {
        return jwt.verify(token, config.secretKey);
    } catch (err) {
        return null;
    }
}

module.exports = { generateJWT, verifyJWT };