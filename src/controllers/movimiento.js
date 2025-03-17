module.exports = (connection) => {
    return {
        consultar: async (req, res) => {
            try {

                const [rows] = await connection.promise().query('SELECT * FROM movimiento WHERE eliminado = ?', [0]);
                res.status(200).json(rows);
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },

        consultarId: async (req, res) => {
            const { id } = req.params;

            try {

                const [rows] = await connection.promise().query('SELECT * FROM movimiento WHERE idmovimiento = ? AND eliminado = ?', [id, 0]);

                if (rows.length === 0) {
                    return res.status(404).json({ message: 'Movimiento no encontrada' });
                }

                res.status(200).json(rows[0]);
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },

        movimiento: async (req, res) => {
            const { cliente_idcliente, metododepago_idmetododepago, promocion_idpromocion, fechamoviento, montototal, iva } = req.body;

            try {
                const [clienteResult] = await connection.promise().query(
                    'SELECT idcliente FROM cliente WHERE idcliente = ?',
                    [cliente_idcliente]
                );

                if (clienteResult.length === 0) {
                    return res.status(400).json({ message: 'El cliente especificado no existe' });
                }

                const [metododepagoResult] = await connection.promise().query(
                    'SELECT idmetododepago FROM metododepago WHERE idmetododepago = ?',
                    [metododepago_idmetododepago]
                );

                if (metododepagoResult.length === 0) {
                    return res.status(400).json({ message: 'El método de pago especificado no existe' });
                }

                const [promocionResult] = await connection.promise().query(
                    'SELECT idpromocion FROM promocion WHERE idpromocion = ?',
                    [promocion_idpromocion]
                );
                if (promocionResult.length === 0) {
                    return res.status(400).json({ message: 'La promoción especificado no existe' });
                }

                const [result] = await connection.promise().query(
                    'INSERT INTO movimiento (cliente_idcliente, metododepago_idmetododepago, promocion_idpromocion, fechamoviento,  montototal,iva, eliminado) VALUES (?, ?, ?, ?, ?,?,?)',
                    [cliente_idcliente, metododepago_idmetododepago, promocion_idpromocion, fechamoviento, montototal, iva, 0]
                );

                res.status(201).json({ message: 'Movimiento registrado', movimientoId: result.insertId });
            } catch (error) {
                console.error('Error al registrar movimiento:', error);
                res.status(500).json({ message: 'Error al registrar movimiento' });
            }
        },

        actualizarMovimiento: async (req, res) => {
            const { id } = req.params;
            const { cliente_idcliente, metodo_pago_idmetodo_pago, promocion_idpromocion, fechamoviento, montototal, iva } = req.body;

            try {
                let query = 'UPDATE movimiento SET ';
                const updates = [];
                const params = [];

                if (cliente_idcliente) {
                    updates.push('cliente_idcliente = ?');
                    params.push(cliente_idcliente);
                }

                if (metodo_pago_idmetodo_pago) {
                    updates.push('metododepago_idmetododepago = ?');
                    params.push(metodo_pago_idmetodo_pago);
                }
                if (promocion_idpromocion) {
                    updates.push('promocion_idpromocion = ?');
                    params.push(promocion_idpromocion);
                }

                if (fechamoviento) {
                    updates.push('fechamoviento = ?');
                    params.push(fechamoviento);
                }

                if (montototal) {
                    updates.push('montototal = ?');
                    params.push(montototal);
                }
                if (iva) {
                    updates.push('iva = ?');
                    params.push(iva);
                }

                if (updates.length === 0) {
                    return res.status(400).json({ message: 'Sin información' });
                }

                query += updates.join(', ') + ' WHERE idmovimiento = ?';
                params.push(id);

                const [result] = await connection.promise().query(query, params);

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Movimiento no encontrada' });
                }

                res.status(200).json({ message: 'Movimiento actualizado exitosamente' });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },

        eliminarMovimiento: async (req, res) => {
            const { id } = req.params;

            try {

                const [result] = await connection.promise().query(
                    'UPDATE movimiento SET eliminado = ? WHERE idmovimiento = ?',
                    [true, id]
                );

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Movimiento no encontrada' });
                }

                res.status(200).json({ message: 'Movimiento eliminado' });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        }
    };
};