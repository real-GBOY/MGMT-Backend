const multer = require('multer');

// Store in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
