const express = require('express');
const promocionController = require('../controllers/promocion');
const upload = require('../middleware/multer'); // Middleware para manejo de archivos

const router = express.Router();

module.exports = (connection) => {
    const controller = promocionController(connection);

    router.post('/promocion', upload.array('images', 4), controller.promocion); // Agrega soporte de imágenes
    router.get('/promocion', controller.consultar);
    router.get('/promocion/:id', controller.consultarId);
    router.patch('/promocion/:id', controller.actualizarPromocion);
    router.delete('/promocion/:id', controller.eliminarPromocion);

    return router;
};
