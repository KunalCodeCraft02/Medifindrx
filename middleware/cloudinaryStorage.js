const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "meditech",
    allowed_formats: ["jpg","png","jpeg","pdf"]
  }
});

const upload = multer({ storage: storage });

module.exports = upload;