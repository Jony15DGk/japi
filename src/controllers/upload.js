const cloudinary = require("../utils/cloudinary");

module.exports = (connection) => {
  return async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No se recibió ningún archivo"
        });
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (error, result) => {
          if (error) {
            console.error("Error en la subida:", error);
            return res.status(500).json({
              success: false,
              message: error.message || "Error en la subida"
            });
          }

          res.status(200).json({
            success: true,
            message: "Uploaded!",
            data: result
          });
        }
      );

      uploadStream.end(req.file.buffer);
      
    } catch (err) {
      console.error("Error inesperado:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Error inesperado"
      });
    }
  };
};

