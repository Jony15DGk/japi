const express = require('express');
const uploadController = require('../controllers/upload');
const upload = require("../middleware/multer");

const router = express.Router();

module.exports = (connection) => {
  const controller = uploadController(connection);

  router.post('/upload', upload.array('images', 4), controller.upload);
  router.post('/uploadGeneral', upload.array('images', 4), controller.uploadGeneral);

  return router;
};
