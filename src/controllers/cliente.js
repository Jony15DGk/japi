module.exports = (connection) => {
    return {
        consultar: async (req, res) => {
            try {
                
                const [rows] = await connection.promise().query('SELECT * FROM cliente WHERE eliminado = ?', [1]);
                res.status(200).json(rows);
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },
  
        consultarId: async (req, res) => {
            const { id } = req.params;
  
            try {
                
                const [rows] = await connection.promise().query('SELECT * FROM cliente WHERE idcliente = ? AND eliminado = ?', [id, 0]);
  
                if (rows.length === 0) {
                    return res.status(404).json({ message: 'Cliente no encontrado' });
                }
  
                res.status(200).json(rows[0]);
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },
  
        cliente: async (req, res) => {
            const { usuario_idusuario, nombre, telefono, ubicacion } = req.body;
        
            try {
                const [usuarioResult] = await connection.promise().query(
                    'SELECT idusuario FROM usuario WHERE idusuario = ?',
                    [usuario_idusuario]
                );
        
                if (usuarioResult.length === 0) {
                    return res.status(400).json({ message: 'El usuario especificado no existe' });
                }
               
                const { lat, lng } = ubicacion;      
                const pointWKT = `POINT(${lng} ${lat})`;
        
                
                const [result] = await connection.promise().query(
                    'INSERT INTO cliente (usuario_idusuario, nombre, telefono, ubicacion, eliminado) VALUES (?, ?, ?, ST_GeomFromText(?), ?)',
                    [usuario_idusuario, nombre, telefono, pointWKT, 0]
                );
        
                res.status(201).json({ message: 'Cliente registrado', clienteId: result.insertId });
            } catch (error) {
                console.error('Error al registrar cliente:', error);
                res.status(500).json({ message: 'Error al registrar cliente' });
            }
        }
   ,
  
        actualizarCliente: async (req, res) => {
            const { id } = req.params;
            const { usuario_idusuario, nombre, telefono, rango} = req.body;
  
            try {
                let query = 'UPDATE cliente SET ';
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
  
                if (telefono) {
                    updates.push('telefono = ?');
                    params.push(telefono);
                }
  
                if (rango) {
                    updates.push('rango = ?');
                    params.push(rango);
                }
  
                if (updates.length === 0) {
                    return res.status(400).json({ message: 'Sin información' });
                }
  
                query += updates.join(', ') + ' WHERE idcliente = ?';
                params.push(id);
  
                const [result] = await connection.promise().query(query, params);
  
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Cliente no encontrado' });
                }
  
                res.status(200).json({ message: 'Cliente actualizado exitosamente' });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },
  
        eliminarCliente: async (req, res) => {
            const { id } = req.params;
  
            try {
                
                const [result] = await connection.promise().query(
                    'UPDATE cliente SET eliminado = ? WHERE idcliente = ?',
                    [1, id]
                );
  
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Cliente no encontrado' });
                }
  
                res.status(200).json({ message: 'Cliente eliminado lógicamente' });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },actualizarUsuarioYCliente: async (req, res) => {
            const { idCliente } = req.params;
            const { usuarioCampos, clienteCampos } = req.body;
          
            try {
              const [usuarioRow] = await connection.promise().query(
                'SELECT usuario_idusuario FROM cliente WHERE idcliente = ?',
                [idCliente]
              );
          
              if (usuarioRow.length === 0) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
              }
          
              const idUsuario = usuarioRow[0].usuario_idusuario;
          
              if (usuarioCampos && Object.keys(usuarioCampos).length > 0) {
                let usuarioQuery = 'UPDATE usuario SET ';
                const usuarioUpdates = [];
                const usuarioParams = [];
          
                for (const campo in usuarioCampos) {
                  if (campo && usuarioCampos[campo] !== undefined) {
                    usuarioUpdates.push(`${campo} = ?`);
                    usuarioParams.push(usuarioCampos[campo]);
                  }
                }
          
                usuarioQuery += usuarioUpdates.join(', ') + ' WHERE idusuario = ?';
                usuarioParams.push(idUsuario);
          
                const [usuarioResult] = await connection.promise().query(usuarioQuery, usuarioParams);
          
                if (usuarioResult.affectedRows === 0) {
                  return res.status(404).json({ message: 'Usuario no encontrado' });
                }
              }
          
              if (clienteCampos && Object.keys(clienteCampos).length > 0) {
                let clienteQuery = 'UPDATE cliente SET ';
                const clienteUpdates = [];
                const clienteParams = [];
          
                for (const campo in clienteCampos) {
                  if (campo && clienteCampos[campo] !== undefined) {
                    clienteUpdates.push(`${campo} = ?`);
                    clienteParams.push(clienteCampos[campo]);
                  }
                }
          
                clienteQuery += clienteUpdates.join(', ') + ' WHERE idcliente = ?';
                clienteParams.push(idCliente);
          
                const [clienteResult] = await connection.promise().query(clienteQuery, clienteParams);
          
                if (clienteResult.affectedRows === 0) {
                  return res.status(404).json({ message: 'Cliente no encontrado' });
                }
              }
          
              res.status(200).json({ message: 'Usuario y Cliente actualizados exitosamente' });
            } catch (error) {
              console.error('Error:', error);
              res.status(500).json({ message: 'Error al actualizar las entidades' });
            }
          }
          
          
    };
  };
