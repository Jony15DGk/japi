const express = require('express');
const guardadoController = require('../controllers/guardado');

const router = express.Router();

module.exports = (connection) => {
  const controller = guardadoController(connection);

  router.post('/guardado', controller.guardado);
  router.get('/guardado', controller.consultar);
  router.get('/guardadoTodo', controller.consultarTodos);
  router.get('/guardado/:id', controller.consultarId);
  router.patch('/guardado/:id', controller.actualizarGuardado);
  router.delete('/guardado/:id', controller.eliminarGuardado); 
  router.get('/guardadoUsuario/:id', controller.guardadoUsuario);
  router.put('/promocion/:idpromocion/cliente/:idcliente/eliminar', controller.eliminarGuardadoPorCliente);
  router.put('/deseliminar/promocion/:idpromocion/cliente/:idcliente/eliminar', controller.deseliminarGuardadoPorCliente);


  return router;
};