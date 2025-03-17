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
            const { usuario_idusuario, nombre, telefono, ubicacion} = req.body;
  
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
  
                if (ubicacion) {
                    updates.push('ubicacion = ?');
                    params.push(ubicacion);
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
        }
    };
  };
