const cloudinary = require("../utils/cloudinary");

module.exports = (connection) => {
  return async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No se recibieron archivos"
        });
      }

      // Validar tipos de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      const invalidFiles = req.files.filter(file => !allowedTypes.includes(file.mimetype));
      
      if (invalidFiles.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Algunos archivos no son imágenes válidas"
        });
      }

      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      const results = await Promise.all(uploadPromises);

      res.status(200).json({
        success: true,
        message: "Uploaded!",
        data: results
      });
    } catch (err) {
      console.error("Error inesperado:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Error inesperado"
      });
    }
  };
};

