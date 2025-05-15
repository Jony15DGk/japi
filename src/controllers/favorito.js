module.exports = (connection) => {
    return {
      consultar: async (req, res) => {
        try {
          const [rows] = await connection.promise().query('SELECT * FROM favorito WHERE eliminado = ?', [0]);
          res.status(200).json(rows);
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ message: 'Error' });
        }
  
      },
      consultarId: async (req, res) => {
        const { id } = req.params;
  
        try {
          const [rows] = await connection.promise().query('SELECT * FROM favorito WHERE idfavorito = ? AND eliminado = ?', [id, 0]);
  
          if (rows.length === 0) {
            return res.status(404).json({ message: 'Favorito no encontrada' });
          }
  
          res.status(200).json(rows[0]);
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ message: 'Error' });
        }
      },
      favorito: async (req, res) => {
        const { cliente_idcliente, nombre, ubicacion } = req.body;
    
        try {
            const [clienteResult] = await connection.promise().query(
                'SELECT idcliente FROM cliente WHERE idcliente = ?',
                [cliente_idcliente]
            );
    
            if (clienteResult.length === 0) {
                return res.status(400).json({ message: 'El cliente especificado no existe' });
            }
    
            const { lat, lng } = ubicacion;
            const pointWKT = `POINT(${lng} ${lat})`;
    
            const [result] = await connection.promise().query(
                'INSERT INTO favorito (cliente_idcliente, nombre, ubicacion, eliminado) VALUES (?, ?, ST_GeomFromText(?), ?)',
                [cliente_idcliente, nombre, pointWKT, 0]
            );
    
            res.status(201).json({ message: 'Favorito registrado', favoritoId: result.insertId });
        } catch (error) {
            console.error('Error al registrar favorito:', error);
            res.status(500).json({ 
                message: 'Error al registrar favorito',
                error: error.message 
            });
        }
    },
      actualizarFavorito: async (req, res) => {
        const { id } = req.params;
        const { cliente_idcliente, nombre, ubicacion } = req.body;
  
        try {
          let query = 'UPDATE favorito SET ';
          const updates = [];
          const params = [];
  
  
          if (cliente_idcliente) {
            updates.push('cliente_idcliente = ?');
            params.push(cliente_idcliente);
          }
          if (nombre) {
            updates.push('nombre = ?');
            params.push(nombre);
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
  
          query += updates.join(', ') + ' WHERE idfavorito  = ?';
          params.push(id);
  
          const [result] = await connection.promise().query(query, params);
  
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Favorito  no econtrada' });
          }
  
          res.status(200).json({ message: 'Favorito actualizada exitosamente' });
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ message: 'Error' });
        }
      },
  
      eliminarFavorito: async (req, res) => {
        const { id } = req.params;
  
        try {
  
          const [result] = await connection.promise().query(
            'UPDATE listadecategoria SET eliminado = ? WHERE idlistadecategoria = ?',
            [1, id]
          );
  
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'listadecategoria no encontrada' });
          }
  
          res.status(200).json({ message: 'listadecategoria eliminada' });
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ message: 'Error' });
        }
      },consultarPorUsuario: async (req, res) => {
  const { idusuario } = req.params;

  try {
    const [clientes] = await connection.promise().query(
      'SELECT idcliente FROM cliente WHERE usuario_idusuario = ? AND eliminado = 0',
      [idusuario]
    );

    if (clientes.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado para el usuario' });
    }

    const idcliente = clientes[0].idcliente;

    const [favoritos] = await connection.promise().query(
      'SELECT * FROM favorito WHERE cliente_idcliente = ? AND eliminado = 0',
      [idcliente]
    );

    if (favoritos.length === 0) {
      return res.status(200).json({ message: 'No hay favoritos', favoritos: [] });
    }

    const [tokens] = await connection.promise().query(
      'SELECT token FROM tokenfcm WHERE usuario_idusuario = ? AND eliminado = 0',
      [idusuario]
    );

    if (tokens.length > 0) {
      const fcmToken = tokens[0].token;

      const admin = require('../utils/fire-base'); 

      const mensaje = {
        notification: {
          title: 'Consulta de Favoritos',
          body: 'Has consultado tu lista de favoritos'
        },
        token: fcmToken
      };

      try {
        await admin.messaging().send(mensaje);
        console.log('Notificación enviada correctamente');
      } catch (error) {
        console.error('Error al enviar notificación:', error);
      }
    }

    res.status(200).json(favoritos);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

  
    };
  };