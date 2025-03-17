const express = require('express');
const notificacionController = require('../controllers/notificacion');

const router = express.Router();

module.exports = (connection) => {
  const controller = notificacionController(connection);

  router.post('/notificacion', controller.notificacion);
  router.get('/notificacion', controller.consultar);
  router.get('/notificacion/:id', controller.consultarId);
  router.patch('/notificacion/:id', controller.actualizarNotificacion);
  router.delete('/notificacion/:id', controller.eliminarNotificacion); 

  return router;
};