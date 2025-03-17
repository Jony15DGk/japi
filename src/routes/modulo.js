const express = require('express');
const moduloController = require('../controllers/modulo');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

module.exports = (connection) => {
  const controller = moduloController(connection);

  router.post('/modulo', controller.modulo);
  router.get('/modulo',authenticateToken(['Administrador']), controller.consultar);
  router.get('/modulo/:id', controller.consultarId);
  router.patch('/modulo/:id', controller.actualizarModulo);
  router.delete('/modulo/:id',authenticateToken(['Administrador']), controller.eliminarModulo); 

  return router;
};
