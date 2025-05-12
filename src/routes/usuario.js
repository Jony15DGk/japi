const express = require('express');
const userController = require('../controllers/usuario');
const authenticateToken = require('../middleware/auth'); 
const verificarConfirmacion = require('../middleware/verificarConfirmacion');
const router = express.Router();

module.exports = (connection) => {
  const controller = userController(connection);
  const middlewareConfirmacion = verificarConfirmacion(connection); 

  router.post('/reset-password', controller.resetPassword); 
  router.post('/resetpassword-request', controller.resetPasswordRequest); 
  router.post('/reset-password-code', controller.resetPasswordWithTokenCode); 
  router.post('/resetpassword-request-code', controller.resetPasswordRequestWithCode); 
  router.post('/verificarcode', controller.verifyCode);
  router.post('/administrador', controller.administrador); 
  router.post('/usuario', controller.usuario); 
  router.post('/vendedor', controller.vendedor);
  router.post('/usuario/login', middlewareConfirmacion, controller.login);
  router.get('/usuario', controller.consultar); 
  router.get('/usuario/:id', controller.consultarId); 
  router.patch('/usuario/:id', controller.actualizarUsuario); 
  router.delete('/usuario/:id', controller.eliminarUsuario); 
  router.post('/usuario/refresh-token', controller.refreshToken);
  router.post('/usuario/logout', controller.logout);
  router.delete('/usuario/superusuario/:id', authenticateToken(['Superusuario']), controller.eliminarsuperusuario); 
  router.post('/usuario/superusuario', authenticateToken(['Superusuario']), controller.superusuario); 
  router.patch('/usuario/superusuario/:id', authenticateToken(['Superusuario']), controller.eliminarsuperusuario); 
  router.get('/usuario/confirmarUsuario/:token', controller.confirmarUsuario)
  return router;
};
