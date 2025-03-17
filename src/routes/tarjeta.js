const express = require('express');
const tarjetaController = require('../controllers/tarjeta');

const router = express.Router();

module.exports = (connection) => {
  const controller = tarjetaController(connection);

  router.post('/tarjeta', controller.tarjeta);
  router.get('/tarjeta', controller.consultar);
  router.get('/tarjeta/:id', controller.consultarId);
  router.patch('/tarjeta/:id', controller.actualizarTarjeta);
  router.delete('/tarjeta/:id', controller.eliminarTarjeta);
 

  return router;
};