const cloudinary = require("../utils/cloudinary");

module.exports = (connection) => {
  return async (req, res) => {
    try {
      const { promocion_id } = req.body; // Se espera recibir el ID de la promoción en el body

      if (!promocion_id) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el ID de la promoción"
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No se recibieron archivos"
        });
      }

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
            { resource_type: "image" },
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

      // Insertar las imágenes en la base de datos
      const insertPromises = results.map((image) => {
        return new Promise((resolve, reject) => {
          connection.query(
            "INSERT INTO imagen (url, public_id, promocion_idpromocion) VALUES (?, ?, ?)",
            [image.secure_url, image.public_id, promocion_id],
            (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            }
          );
        });
      });

      await Promise.all(insertPromises);

      res.status(200).json({
        success: true,
        message: "Imágenes subidas y guardadas correctamente",
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

