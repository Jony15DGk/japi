const multer = require('multer');

const storage = multer.memoryStorage(); // Guardar en memoria en lugar de disco

const upload = multer({ storage: storage });

module.exports = upload;
