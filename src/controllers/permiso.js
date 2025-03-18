module.exports = (connection) => {
    return {
        consultar: async (req, res) => {
            const query = 'SELECT * FROM permiso WHERE eliminado = 0';
            connection.query(query, (error, results) => {
                if (error) {
                    res.status(500).json({ error: 'Error al obtener permisos' });
                } else {
                    res.status(200).json(results);
                }
            });
        },

        consultarId: async (req, res) => {
            const { idpermiso } = req.params;
            const id = parseInt(idpermiso, 10);

            if (isNaN(id)) {
                return res.status(400).json({ message: 'ID no válido' });
            }

            try {
                const [rows] = await connection.promise().query('SELECT * FROM permiso WHERE idpermiso = ? AND eliminado = ?', [idpermiso, 0]);

                if (rows.length === 0) {
                    return res.status(404).json({ message: 'Permiso no encontrado' });
                }

                res.status(200).json(rows[0]);
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },

        permiso: async (req, res) => {
            const { nombre, idcreador } = req.body;

            try {
                const valoresPermitidos = ['Crear', 'Consultar', 'Actualizar', 'Eliminar'];
                if (!valoresPermitidos.includes(nombre)) {
                    return res.status(400).json({ message: 'Valor de nombre no válido' });
                }


                const [result] = await connection.promise().query(
                    'INSERT INTO permiso ( nombre,  idcreador, idactualizacion, fechacreacion, fechaactualizacion, eliminado) VALUES (?, ?, ?, ?, ?, ?)',
                    [nombre, idcreador, null, new Date(), null, 0]
                );

                res.status(201).json({ message: 'Permiso registrada', promId: result.insertId });
            } catch (error) {
                console.error('Error al registrar permiso:', error);
                res.status(500).json({ message: 'Error al registrar permiso' });
            }
        },

        actualizarPermiso: async (req, res) => {
            const { idpermiso } = req.params;
            const id = parseInt(idpermiso, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'ID no válido' });
            }


            const { nombre, idcreador, idactualizacion, fechacreacion, fechaactualizacion } = req.body;

            try {
                let query = 'UPDATE permiso SET ';
                const updates = [];
                const params = [];

                if (nombre) {
                    updates.push('nombre = ?');
                    params.push(nombre);
                }

                if (idcreador) {
                    updates.push('idcreador = ?');
                    params.push(idcreador);
                }

                if (idactualizacion) {
                    updates.push('idactualizacion = ?');
                    params.push(idactualizacion);
                }

                if (fechacreacion) {
                    updates.push('fechacreacion = ?');
                    params.push(fechacreacion);
                }


                if (fechaactualizacion !== undefined) {
                    updates.push('fechaactualizacion = NOW()');
                    params.push(fechaactualizacion);
                }

                if (updates.length === 0) {
                    return res.status(400).json({ message: 'Sin información' });
                }

                query += updates.join(', ') + ' WHERE idpermiso = ?';
                params.push(idpermiso);

                const [result] = await connection.promise().query(query, params);

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Permiso no encontrado' });
                }

                res.status(200).json({ message: 'Permiso actualizado exitosamente' });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },

        eliminarPermiso: async (req, res) => {
            const { idpermiso } = req.params;

            try {

                const [result] = await connection.promise().query(
                    'UPDATE permiso SET eliminado = ? WHERE idpermiso = ?',
                    [1, idpermiso]
                );

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Permiso no encontrada' });
                }

                res.status(200).json({ message: 'Permiso eliminada lógicamente' });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        }
    };
};
