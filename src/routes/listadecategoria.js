const express = require('express');
const listadecategoriaController = require('../controllers/listadecategoria');

const router = express.Router();

module.exports = (connection) => {
  const controller = listadecategoriaController(connection);

  router.post('/listadecategoria', controller.listadecategoria);
  router.get('/listadecategoria', controller.consultar);
  router.get('/listadecategoria/:id', controller.consultarId);
  router.patch('/listadecategoria/:id', controller.actualizarListadecategoria);
  router.delete('/listadecategoria/:id', controller.eliminarListadecategoria); 

  return router;
};