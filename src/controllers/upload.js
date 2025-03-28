const cloudinary = require("../utils/cloudinary");
const upload = require("../middleware/multer");

module.exports = (connection) => {
  return async (req, res) => {
    try {
      console.log("Archivo recibido:", req.file); // 🔍 Verificar contenido del archivo

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No se ha recibido ningún archivo",
        });
      }

      const result = await cloudinary.uploader.upload(req.file.path);

      res.status(200).json({
        success: true,
        message: "Uploaded!",
        data: result
      });
    } catch (err) {
      console.error("Error en la subida:", err); // 🔴 Imprimir el error detallado
      res.status(500).json({
        success: false,
        message: "Error",
        error: err.message // Agregar mensaje de error
      });
    }
  };
};

