const express = require('express');
const categoriaController = require('../controllers/categoria');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

module.exports = (connection) => {
  const controller = categoriaController(connection);

  router.post('/categoria', controller.categoria);
  router.get('/categoria',controller.consultar);
  router.get('/categoria/:id', controller.consultarId);
  router.patch('/categoria/:id', controller.actualizarCategoria);
  router.delete('/categoria/:id', controller.eliminarCategoria);

  return router;
};