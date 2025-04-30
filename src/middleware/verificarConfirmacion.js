const verificarConfirmacion = (pool) => {
  return async (req, res, next) => {
    const connectionPromise = pool.promise();
    const { email } = req.body;

    try {
      const [usuarios] = await connectionPromise.query(
        'SELECT estatus FROM usuario WHERE email = ?',
        [email]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({ success: false, emailExists:false, pending:false });
      }

      const { estatus } = usuarios[0];

      if (estatus === 0) {
        return res.status(401).json({ success: false, emailExists:true, pending: true });
      }

      next();

    } catch (error) {
      console.error('Error en verificarConfirmacion:', error);
      res.status(500).json({ success: false, msg: 'Error interno en validación de usuario' });
    }
  };
};

module.exports = verificarConfirmacion;
