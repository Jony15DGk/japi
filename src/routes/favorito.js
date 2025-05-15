const express = require('express');
const favoritoController = require('../controllers/favorito');
const router = express.Router();

module.exports = (connection) => {
  const controller = favoritoController(connection);

  router.post('/favorito', controller.favorito);
  router.get('/favorito', controller.consultar);
  router.get('/favorito/:id', controller.consultarId);
  router.patch('/favorito/:id', controller.actualizarFavorito);
  router.delete('/favorito/:id', controller.eliminarFavorito);
  router.get('/favorito/usuario/:idusuario', controller.consultarPorUsuario);


 return router;
};