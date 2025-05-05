const express = require('express');
const clienteController = require('../controllers/cliente');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

module.exports = (connection) => {
  const controller = clienteController(connection);

  router.post('/cliente', controller.cliente);
  router.get('/cliente', authenticateToken(['Administrador']), controller.consultar);
  router.get('/cliente/:id', controller.consultarId);
  router.patch('/cliente/:id', controller.actualizarCliente);
  router.patch('/clienteyusuario/:id', controller.actualizarUsuarioYCliente);
  router.delete('/cliente/:id',authenticateToken(['Administrador']), controller.eliminarCliente);

  return router;
};