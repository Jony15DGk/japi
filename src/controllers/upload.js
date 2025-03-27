const cloudinary = require("../utils/cloudinary");
const upload = require("../middleware/multer");

module.exports = (connection) => {
  return async (req, res) => {
    try {
      const result = await cloudinary.uploader.upload(req.file.path);
      res.status(200).json({
        success: true,
        message: "Uploaded!",
        data: result
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        message: "Error"
      });
    }
  };
};
