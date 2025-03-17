module.exports = (connection) => {
  return {
      consultar: async (req, res) => {
          try {             
              const [rows] = await connection.promise().query('SELECT * FROM notificacion WHERE eliminado = ?', [0]);
              res.status(200).json(rows);
          } catch (error) {
              console.error('Error:', error);
              res.status(500).json({ message: 'Error' });
          }
      },

      consultarId: async (req, res) => {
          const { id } = req.params;

          try {
              
              const [rows] = await connection.promise().query('SELECT * FROM notificacion WHERE idnotificacion = ? AND eliminado = ?', [id, 0]);

              if (rows.length === 0) {
                  return res.status(404).json({ message: 'Notificación no encontrada' });
              }

              res.status(200).json(rows[0]);
          } catch (error) {
              console.error('Error:', error);
              res.status(500).json({ message: 'Error' });
          }
      },

      notificacion: async (req, res) => {
          const { cliente_idcliente, promocion_idpromocion, fechayhora, leido } = req.body;

          try {
            const [clienteResult] = await connection.promise().query(
                'SELECT idcliente FROM cliente WHERE idcliente = ?',
                [cliente_idcliente]
            );
    
            if (clienteResult.length === 0) {
                return res.status(400).json({ message: 'El cliente especificado no existe' });
            }

            const [promocionResult] = await connection.promise().query(
                'SELECT idpromocion FROM promocion WHERE idpromocion = ?',
                [promocion_idpromocion]
            );
    
            if (promocionResult.length === 0) {
                return res.status(400).json({ message: 'La promoción especificado no existe' });
            }
              
              const [result] = await connection.promise().query(
                  'INSERT INTO notificacion (cliente_idcliente, promocion_idpromocion, fechayhora, leido, eliminado) VALUES (?, ?, ?, ?, ?)',
                  [cliente_idcliente, promocion_idpromocion, fechayhora, leido, 0]
              );

              res.status(201).json({ message: 'Notificación registrada', notificacionId: result.insertId });
          } catch (error) {
              console.error('Error al registrar notificación:', error);
              res.status(500).json({ message: 'Error al registrar notificación' });
          }
      },

      actualizarNotificacion: async (req, res) => {
          const { id } = req.params;
          const { cliente_idcliente, promocion_idpromocion, fechayhora, leido } = req.body;

          try {
              let query = 'UPDATE notificacion SET ';
              const updates = [];
              const params = [];

              if (cliente_idcliente !== undefined) {
                  updates.push('cliente_idcliente = ?');
                  params.push(cliente_idcliente);
              }

              if (promocion_idpromocion !== undefined) {
                  updates.push('promocion_idpromocion = ?');
                  params.push(promocion_idpromocion);
              }

              if (fechayhora !== undefined) {
                  updates.push('fechayhora = ?');
                  params.push(fechayhora);
              }

              if (leido !== undefined) {
                  updates.push('leido = ?');
                  params.push(leido);
              }

              if (updates.length === 0) {
                  return res.status(400).json({ message: 'Sin información' });
              }

              query += updates.join(', ') + ' WHERE idnotificacion = ?';
              params.push(id);

              const [result] = await connection.promise().query(query, params);

              if (result.affectedRows === 0) {
                  return res.status(404).json({ message: 'Notificación no encontrada' });
              }

              res.status(200).json({ message: 'Notificación actualizada exitosamente' });
          } catch (error) {
              console.error('Error:', error);
              res.status(500).json({ message: 'Error' });
          }
      },

      eliminarNotificacion: async (req, res) => {
          const { id } = req.params;

          try {
            
              const [result] = await connection.promise().query(
                  'UPDATE notificacion SET eliminado = ? WHERE idnotificacion = ?',
                  [1, id]
              );

              if (result.affectedRows === 0) {
                  return res.status(404).json({ message: 'Notificación no encontrada' });
              }

              res.status(200).json({ message: 'Notificación eliminada lógicamente' });
          } catch (error) {
              console.error('Error:', error);
              res.status(500).json({ message: 'Error' });
          }
      }
  };
};