const express = require('express');
const userController = require('../controllers/usuario');
const authenticateToken = require('../middleware/auth'); 
const router = express.Router();

module.exports = (connection) => {
  const controller = userController(connection);

  
  router.post('/usuario', controller.usuario); 
  router.post('/usuario/login', controller.login)
  router.get('/usuario', authenticateToken(['Administrador']), controller.consultar); 
  router.get('/usuario/:id', controller.consultarId); 
  router.patch('/usuario/:id', controller.actualizarUsuario); 
  router.delete('/usuario/:id', authenticateToken(['Administrador']), controller.eliminarUsuario); 
  router.post('/usuario/refresh-token', controller.refreshToken);
  router.post('/usuario/logout', controller.logout);
  router.delete('/usuario/superusuario/:id', authenticateToken(['Superusuario']), controller.eliminarsuperusuario); 
  router.post('/usuario/superusuario', authenticateToken(['Superusuario']), controller.superusuario); 
  router.patch('/usuario/superusuario/:id', authenticateToken(['Superusuario']), controller.eliminarsuperusuario); 
 
  return router;
};