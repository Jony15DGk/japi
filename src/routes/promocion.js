const express = require('express');
const promocionController = require('../controllers/promocion');

const router = express.Router();

module.exports = (connection) => {
  const controller = promocionController(connection);

  router.post('/promocion', controller.promocion);
  router.get('/promocion', controller.consultar);
  router.get('/promocion/:id', controller.consultarId);
  router.patch('/promocion/:id', controller.actualizarPromocion);
  router.delete('/promocion/:id', controller.eliminarPromocion);

  return router;
};