//rutas de matriz
const express = require('express');
const matrizController = require('../controllers/matriz');
const router = express.Router();

module.exports = (connection) => {
  const controller = matrizController(connection);

  router.post('/matriz', controller.crearmatriz);
  router.get('/matriz', controller.consultar);
  router.get('/matriz/:id', controller.consultarId);
  router.patch('/matriz/:id', controller.actualizarMatriz);
  router.delete('/matriz/:id', controller.eliminarMatriz);

 return router;
};