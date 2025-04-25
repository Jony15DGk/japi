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
    consultarTodos: async (req, res) => {
      try {
        const [rows] = await connection.promise().query('SELECT * FROM guardado ');
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
      const { promocion_idpromocion, cliente_idcliente } = req.body;

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
          [promocion_idpromocion, cliente_idcliente, new Date(), 0]
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
    },guardadoUsuario: async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await connection.promise().query(
      `SELECT 
         g.idguardado, 
         g.promocion_idpromocion, 
         p.nombre AS nombre_promocion, 
         p.vigenciafin, 
         p.vigenciainicio, 
         e.nombre AS nombre_empresa, 
         p.precio 
       FROM guardado AS g 
       INNER JOIN cliente AS c ON g.cliente_idcliente = c.idcliente 
       INNER JOIN promocion AS p ON p.idpromocion = g.promocion_idpromocion 
       INNER JOIN empresa AS e ON e.idempresa = p.empresa_idempresa 
       INNER JOIN usuario AS u ON c.usuario_idusuario = u.idusuario 
       WHERE c.usuario_idusuario = ? AND g.eliminado = ?`,
      [id, 0]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Guardado no encontrado' });
    }
    const promocionesConImagenes = await Promise.all(
      rows.map(async (promocion) => {
          const [imagenes] = await connection.promise().query(
              'SELECT idimagen, url, public_id FROM imagen WHERE promocion_idpromocion = ?',
              [promocion.promocion_idpromocion]
          );
          return {
              ...promocion,
              imagenes: imagenes.map(img => ({
                  id: img.idimagen,
                  url: img.url,
                  public_id: img.public_id
              }))
          };
      })
  );

    res.status(200).json(promocionesConImagenes); 
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al obtener guardados' });
  }
},eliminarGuardadoPorCliente: async (req, res) => {
  const { idpromocion, idcliente } = req.params;

  try {
    const [result] = await connection.promise().query(
      'UPDATE guardado SET eliminado = ? WHERE promocion_idpromocion = ? AND cliente_idcliente = ?',
      [1, idpromocion, idcliente]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Guardado no encontrado para ese cliente' });
    }

    res.status(200).json({ message: 'Guardado eliminado lógicamente para el cliente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al eliminar el guardado' });
  }
},deseliminarGuardadoPorCliente: async (req, res) => {
  const { idpromocion, idcliente } = req.params;

  try {
    const [result] = await connection.promise().query(
      'UPDATE guardado SET eliminado = ? WHERE promocion_idpromocion = ? AND cliente_idcliente = ?',
      [0, idpromocion, idcliente]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Guardado no encontrado para ese cliente' });
    }

    res.status(200).json({ message: 'Guardado deseliminado lógicamente para el cliente' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al eliminar el guardado' });
  }
}



  };
};