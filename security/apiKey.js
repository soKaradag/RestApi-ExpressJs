const config = require('../config');

// Verify APIKey
function verifyApiKey(req, res, next) {
  const apiKeyHeader = req.headers["api-key"];

  if (!apiKeyHeader || apiKeyHeader !== config.apiKey) {
    console.error("Invalid API key");
    return res.status(403).json({ error: "UNAUTHORIZED API KEY" });
  }

  next();
}

module.exports = verifyApiKey;