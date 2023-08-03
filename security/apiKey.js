const config = require('../config');

// Verify APIKey
function verifyApiKey(req, res, next) {
  const apiKeyHeader = req.headers["api-key"];

  //If api key and user api key are note same print error
  if (!apiKeyHeader || apiKeyHeader !== config.apiKey) {
    console.error("Invalid API key");
    return res.status(403).json({ error: "UNAUTHORIZED API KEY" });
  }
  //Else go to next task
  next();
}

module.exports = verifyApiKey;