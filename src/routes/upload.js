const express = require('express');
const uploadController = require('../controllers/upload');
const upload = require("../middleware/multer");

const router = express.Router();

module.exports = (connection) => {
  const controller = uploadController(connection); // ✅ Ahora sí es una función válida

  router.post('/', upload.single('image'), controller); // ✅ Añadimos `upload.single('image')`

  return router;
};
