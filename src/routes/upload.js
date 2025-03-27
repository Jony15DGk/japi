const express = require('express');
const uploadController = require('../controllers/upload');

const router = express.Router();

module.exports = (connection) => {
  const controller = uploadController(connection);

  router.post('/', controller);
 

  return router;
};