const cloudinary = require("../utils/cloudinary");

module.exports = (connection) => {
  return  {
    upload:async (req, res) =>{
      try {
        const { promocion_id } = req.body; 
  
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
    },
    uploadGeneral: async (req, res) => {
      const {
        matriz_id,
        categoria_idcategoria,
        nombre,
        descripcion,
        precio,
        vigenciainicio,
        vigenciafin,
        tipo
      } = req.body;
    
      if (tipo !== "General") {
        return res.status(400).json({
          success: false,
          message: "Este endpoint es solo para promociones generales"
        });
      }
    
      try {
        
        const [empresas] = await new Promise((resolve, reject) => {
          connection.query(
            "SELECT idempresa FROM empresa WHERE matriz_idmatriz = ? AND eliminado = 0",
            [matriz_id],
            (err, result) => {
              if (err) return reject(err);
              resolve(result);
            }
          );
        });
    
        if (empresas.length === 0) {
          return res.status(404).json({ success: false, message: "No se encontraron empresas para esa matriz." });
        }
    
        
        const insertPromises = empresas.map((empresa) => {
          return new Promise((resolve, reject) => {
            connection.query(
              `INSERT INTO promocion 
                (empresa_idempresa, categoria_idcategoria, nombre, descripcion, precio, vigenciainicio, vigenciafin, tipo, eliminado)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'General', 0)`,
              [empresa.idempresa, categoria_idcategoria, nombre, descripcion, precio, vigenciainicio, vigenciafin],
              (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
              }
            );
          });
        });
    
        const promocionIds = await Promise.all(insertPromises);
    
        res.status(201).json({
          success: true,
          message: "Promoción general creada para todas las empresas",
          promociones_creadas: promocionIds
        });
    
      } catch (err) {
        console.error("Error al crear promociones generales:", err);
        res.status(500).json({
          success: false,
          message: "Error al crear promociones generales",
          error: err.message
        });
      }
    }    
  
  };
};

