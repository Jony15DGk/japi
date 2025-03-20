const express = require('express');
const multer = require('multer');
const upload = multer({dest: '../uploads/'})


const router = express.Router();

module.exports = (connection) => {
  

  router.post('/upload', upload.single('promocionFile'), (req, res)=> {
    console.log(req.file);
    res.send('Termina');
  });

  return router;
};