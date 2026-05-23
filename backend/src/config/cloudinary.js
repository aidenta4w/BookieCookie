const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (cloudinaryUrl) {
  const parsedUrl = new URL(cloudinaryUrl);

  cloudinary.config({
    cloud_name: parsedUrl.hostname,
    api_key: decodeURIComponent(parsedUrl.username),
    api_secret: decodeURIComponent(parsedUrl.password),
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const uploadBufferToCloudinary = (buffer, { originalFilename, folder }) =>
  new Promise((resolve, reject) => {
    const publicId = originalFilename
      ? path.parse(originalFilename).name
      : `book-cover-${Date.now()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${publicId}-${Date.now()}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });

module.exports = {
  cloudinary,
  uploadBufferToCloudinary,
};
