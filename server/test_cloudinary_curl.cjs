require('dotenv').config();
const cloudinary = require('cloudinary').v2;

const timestamp = Math.round(new Date().getTime() / 1000);
const signature = cloudinary.utils.api_sign_request({ timestamp }, process.env.CLOUDINARY_API_SECRET);

console.log(`curl -X POST https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload \\
  -F "file=data:text/plain;base64,SGVsbG8gV29ybGQ=" \\
  -F "api_key=${process.env.CLOUDINARY_API_KEY}" \\
  -F "timestamp=${timestamp}" \\
  -F "signature=${signature}"`);
