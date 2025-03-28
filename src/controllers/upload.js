const cloudinary = require("../utils/cloudinary");
const upload = require("../middleware/multer");

module.exports = (connection) => {
  return async (req, res) => {
    try {
      const result = await cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
        if (error) {
          console.error("Error en Cloudinary:", error);
          return res.status(500).json({ success: false, message: "Error en la subida" });
        }
        res.status(200).json({ success: true, message: "Uploaded!", data: result });
      }).end(req.file.buffer);
      
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
