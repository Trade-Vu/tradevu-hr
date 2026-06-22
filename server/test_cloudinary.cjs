require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const FormData = require('form-data');

async function testUpload() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp }, process.env.CLOUDINARY_API_SECRET);
  
  const formData = new FormData();
  formData.append('file', 'data:text/plain;base64,SGVsbG8gV29ybGQ=');
  formData.append('api_key', process.env.CLOUDINARY_API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  const url = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`;
  const response = await fetch(url, { method: 'POST', body: formData, headers: formData.getHeaders() });
  
  console.log('Status:', response.status);
  const data = await response.json();
  console.log(data);
}

testUpload().catch(console.error);
