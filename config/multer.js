// config/multer.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

// Set up Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folder = 'cab_uploads';
    return {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      public_id: `${file.fieldname}-${Date.now()}`,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
