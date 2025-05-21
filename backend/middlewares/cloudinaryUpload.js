import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import streamifier from 'streamifier';

const uploadToCloudinary = (req, res, next) => {
  const upload = multer().single('image'); // expects 'image' field
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: 'Upload error', error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    try {
      const streamUpload = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };
      const result = await streamUpload();
      req.cloudinaryUrl = result.secure_url;
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Cloudinary upload failed', error: error.message });
    }
  });
};

export default uploadToCloudinary;
