const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (_, file, cb) => {
    cb(null, `trip-upload-${Date.now()}${path.extname(file.originalname)}`);
  }
});

module.exports = multer({ storage });
