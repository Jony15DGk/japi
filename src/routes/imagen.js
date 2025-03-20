const express = require('express');
const multer = require('multer');
const upload = multer({dest: '../uploads/'})
const imagenController = require('../controllers/imagen');

const router = express.Router();

module.exports = (connection) => {
  const controller = imagenController(connection);

  router.post('/upload', upload.single('promocionFile'), (req, res)=> {
    console.log(req.file);
    res.send('Termina');
  });

  return router;
};