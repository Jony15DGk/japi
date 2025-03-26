

module.exports = (connection) => {
  return {
    consultar: async (req, res) => {
      try {
        const [rows] = await connection.promise().query('SELECT * FROM empresa WHERE eliminado = ?', [0]);
        res.status(200).json(rows);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }

    },

    consultarId: async (req, res) => {
      const { id } = req.params;

      try {
        const [rows] = await connection.promise().query('SELECT * FROM empresa WHERE idempresa = ? AND eliminado = ?', [id, 0]);

        if (rows.length === 0) {
          return res.status(404).json({ message: 'Empresa no encontrada' });
        }

        res.status(200).json(rows[0]);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    },
    empresa: async (req, res) => {
      const { usuario_idusuario,matriz_idmatriz, nombre, descripcion, ubicacion } = req.body;

      try {
        const [usuarioResult] = await connection.promise().query(
          'SELECT idusuario FROM usuario WHERE idusuario = ?',
          [usuario_idusuario]
        );

        if (usuarioResult.length === 0) {
          return res.status(400).json({ message: 'El usuario especificado no existe' });
        }

        const [matrizResult] = await connection.promise().query(
          'SELECT idmatriz FROM matriz WHERE idmatriz = ?',
          [matriz_idmatriz]
        );

        if (matrizResult.length === 0) {
          return res.status(400).json({ message: 'La matriz especificada no existe' });
        }

        const { lat, lng } = ubicacion;

        const pointWKT = `POINT(${lng} ${lat})`;

        const [result] = await connection.promise().query(
          'INSERT INTO empresa (usuario_idusuario, matriz_idmatriz, nombre, descripcion, ubicacion, eliminado) VALUES (?, ?, ?, ?, ST_GeomFromText(?), ?)',
          [usuario_idusuario,matriz_idmatriz, nombre, descripcion, pointWKT, 0]
        );

        res.status(201).json({ message: 'Empresa registrada', rolId: result.insertId });
      } catch (error) {
        console.error('Error al registrar empresa:', error);
        res.status(500).json({ message: 'Error al registrar empresa' });
      }
    },
    actualizarEmpresa: async (req, res) => {
      const { id } = req.params;
      const { usuario_idusuario, nombre, descripcion, ubicacion } = req.body;

      try {
        let query = 'UPDATE empresa SET ';
        const updates = [];
        const params = [];

        if (usuario_idusuario) {
          updates.push('usuario_idusuario = ?');
          params.push(usuario_idusuario);
        }

        if (nombre) {
          updates.push('nombre = ?');
          params.push(nombre);
        }

        if (descripcion) {
          updates.push('descripcion = ?');
          params.push(descripcion);
        }

        if (ubicacion) {

          const { lat, lng } = ubicacion;
          const pointWKT = `POINT(${lng} ${lat})`;
          updates.push('ubicacion = ST_GeomFromText(?)');
          params.push(pointWKT);
        }

        if (updates.length === 0) {
          return res.status(400).json({ message: 'Sin información' });
        }

        query += updates.join(', ') + ' WHERE idempresa = ?';
        params.push(id);

        const [result] = await connection.promise().query(query, params);

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Empresa no encontrada' });
        }

        res.status(200).json({ message: 'Empresa actualizada exitosamente' });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al actualizar la empresa' });
      }
    },

    eliminarEmpresa: async (req, res) => {
      const { id } = req.params;

      try {
        const [result] = await connection.promise().query(
          'UPDATE empresa SET eliminado = ? WHERE idempresa = ?',
          [true, id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Empresa no encontrado' });
        }

        res.status(200).json({ message: 'Empresa eliminada ' });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    }
  };

};