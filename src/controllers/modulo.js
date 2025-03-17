module.exports = (connection) => {
    return {
        consultar: async (req, res) => {
            try {
                const [rows] = await connection.promise().query('SELECT * FROM modulo WHERE eliminado = ?', [0]);
                res.status(200).json(rows);
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },

        modulo: async (req, res) => {
            const { permiso_idpermiso, rol_idrol, idcreador } = req.body;
        
            try {
               
                const [permisoResult] = await connection.promise().query(
                    'SELECT idpermiso FROM permiso WHERE idpermiso = ?',
                    [permiso_idpermiso]
                );
        
                if (permisoResult.length === 0) {
                    return res.status(400).json({ message: 'El permiso especificado no existe' });
                }
        
                
                const [rolResult] = await connection.promise().query(
                    'SELECT idrol FROM rol WHERE idrol = ?',
                    [rol_idrol]
                );
        
                if (rolResult.length === 0) {
                    return res.status(400).json({ message: 'El rol especificado no existe' });
                }
        
                
                const [result] = await connection.promise().query(
                    'INSERT INTO modulo (permiso_idpermiso, rol_idrol, idcreador, idactualizacion, fechacreacion, fechaactualizacion, eliminado) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [permiso_idpermiso, rol_idrol, idcreador, null, new Date(), null, 0]
                );
        
                res.status(201).json({ message: 'Módulo registrado', moduloId: result.insertId });
            } catch (error) {
                console.error('Error al registrar módulo:', error);
                res.status(500).json({ message: 'Error al registrar módulo' });
            }
        },

        consultarId: async (req, res) => {
            const { id } = req.params;

            try {
                const [rows] = await connection.promise().query('SELECT * FROM modulo WHERE idmodulo = ? AND eliminado = ?', [id, 0]);

                if (rows.length === 0) {
                    return res.status(404).json({ message: 'Modulo no encontrado' });
                }

                res.status(200).json(rows[0]);
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },

        actualizarModulo: async (req, res) => {
            const { idmodulo } = req.params;
            console.log("Valor de idmodulo:", idmodulo);
            const id = parseInt(idmodulo, 10);
        
            if (isNaN(id)) {
                return res.status(400).json({ message: 'ID no válido' });
            }
        
        
            console.log("Cuerpo de la solicitud:", req.body);
        
            const { permiso_idpermiso, rol_idrol, idcreador, idactualizacion, fechacreacion, fechaactualizacion } = req.body;
        
            try {
                let query = 'UPDATE modulo SET ';
                const updates = [];
                const params = [];
        
                
                if (permiso_idpermiso !== undefined) {
                    updates.push('permiso_idpermiso = ?');
                    params.push(permiso_idpermiso);
                }
        
                if (rol_idrol !== undefined) {
                    updates.push('rol_idrol = ?');
                    params.push(rol_idrol);
                }
        
                if (idcreador !== undefined) {
                    updates.push('idcreador = ?');
                    params.push(idcreador);
                }
        
                if (idactualizacion) {
                    updates.push('idactualizacion = ?');
                    params.push(idactualizacion);
                }
        
                if (fechacreacion ) {
                    updates.push('fechacreacion = ?');
                    params.push(fechacreacion);
                }
        
                if (fechaactualizacion) {
                    updates.push('fechaactualizacion = NOW()');
                    params.push(fechaactualizacion);
                }
        
                
                if (updates.length === 0) {
                    return res.status(400).json({ message: 'Sin información' });
                }
        
            
                query += updates.join(', ') + ' WHERE idmodulo = ?';
                params.push(id);
        
                
                const [result] = await connection.promise().query(query, params);
        
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Modulo no encontrado' });
                }
        
               
                res.status(200).json({ message: 'Modulo actualizado exitosamente' });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },

        eliminarModulo: async (req, res) => {
            const { id } = req.params;

            try {
                const [result] = await connection.promise().query(
                    'UPDATE permiso SET eliminado = ? WHERE idpermiso = ?',
                    [1, id]
                );

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Modulo no encontrado' });
                }

                res.status(200).json({ message: 'Permiso eliminado' });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        }
    };
};
