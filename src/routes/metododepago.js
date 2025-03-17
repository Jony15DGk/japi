const express = require('express');
const metododepagoController = require('../controllers/metododepago');

const router = express.Router();

module.exports = (connection) => {
  const controller = metododepagoController(connection);

  router.post('/metododepago', controller.metododepago);
  router.get('/metododepago', controller.consultar);
  router.get('/metododepago/:id', controller.consultarId);
  router.patch('/metododepago/:id', controller.actualizarMetododepago);
  router.delete('/metododepago/:id', controller.eliminarMetododepago);

  return router;
};