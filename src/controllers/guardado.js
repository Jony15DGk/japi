module.exports = (connection) => {
  return {
    consultar: async (req, res) => {
      try {
        const [rows] = await connection.promise().query('SELECT * FROM guardado WHERE eliminado = ?', [0]);
        res.status(200).json(rows);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }

    },
    consultarId: async (req, res) => {
      const { id } = req.params;

      try {
        const [rows] = await connection.promise().query('SELECT * FROM guardado WHERE idguardado = ? AND eliminado = ?', [id, 0]);

        if (rows.length === 0) {
          return res.status(404).json({ message: 'Guardado no encontrado' });
        }

        res.status(200).json(rows[0]);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    },
    guardado: async (req, res) => {
      const { promocion_idpromocion, cliente_idcliente, fechaguardada } = req.body;

      try {
        const [promocionResult] = await connection.promise().query(
          'SELECT idpromocion FROM promocion WHERE idpromocion = ?',
          [promocion_idpromocion]
        );
        if (promocionResult.length === 0) {
          return res.status(400).json({ message: 'La promoción especificado no existe' });
        }

        const [clienteResult] = await connection.promise().query(
          'SELECT idcliente FROM cliente WHERE idcliente = ?',
          [cliente_idcliente]
        );

        if (clienteResult.length === 0) {
          return res.status(400).json({ message: 'El cliente especificado no existe' });
        }



        const [result] = await connection.promise().query(
          'INSERT INTO guardado (promocion_idpromocion, cliente_idcliente, fechaguardada, eliminado) VALUES (?, ?, ?, ?)',
          [promocion_idpromocion, cliente_idcliente, fechaguardada, 0]
        );

        res.status(201).json({ message: 'Guardado registrada', guardadoId: result.insertId });
      } catch (error) {
        console.error('Error al registrar guardado:', error);
        res.status(500).json({ message: 'Error al registrar guardado' });
      }
    },
    actualizarGuardado: async (req, res) => {
      const { id } = req.params;
      const { cliente_idcliente, promocion_idpromocion, fechaguardada } = req.body;

      try {
        let query = 'UPDATE guardado SET ';
        const updates = [];
        const params = [];

        if (promocion_idpromocion) {
          updates.push('promocion_idpromocion = ?');
          params.push(promocion_idpromocion);
        }

        if (cliente_idcliente) {
          updates.push('cliente_idcliente = ?');
          params.push(cliente_idcliente);
        }

        if (fechaguardada) {
          updates.push('fechaguardada = ?');
          params.push(fechaguardada);
        }


        if (updates.length === 0) {
          return res.status(400).json({ message: 'Sin información' });
        }

        query += updates.join(', ') + ' WHERE idguardado = ?';
        params.push(id);

        const [result] = await connection.promise().query(query, params);

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'guardado no econtrada' });
        }

        res.status(200).json({ message: 'Guardado actualizada exitosamente' });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    },

    eliminarGuardado: async (req, res) => {
      const { id } = req.params;

      try {

        const [result] = await connection.promise().query(
          'UPDATE guardado SET eliminado = ? WHERE idguardado = ?',
          [1, id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Guardado no encontrada' });
        }

        res.status(200).json({ message: 'Guardado eliminado lógicamente' });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    }

  };
};