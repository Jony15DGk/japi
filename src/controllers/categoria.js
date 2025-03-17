module.exports = (connection) => {
  return {
    consultar: async (req, res) => {
      try {
        const [rows] = await connection.promise().query('SELECT * FROM categoria WHERE eliminado = ?', 0);
        res.status(200).json(rows);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    },
    categoria: async (req, res) => {
      const { nombre, idcreador, idactualizacion, fechacreacion, fechaactualizacion } = req.body;

      try {

        const [result] = await connection.promise().query(
          'INSERT INTO categoria (nombre, idcreador, idactualizacion, fechacreacion, fechaactualizacion, eliminado) VALUES (?, ?, ?, ?, ?, ?)',
          [nombre, idcreador, idactualizacion, fechacreacion, fechaactualizacion, 0]
        );

        res.status(201).json({ message: 'Categoria registrada', categoriaId: result.insertId });
      } catch (error) {
        console.error('Error al registrar categoria:', error);
        res.status(500).json({ message: 'Error al registrar categoría' });
      }
    },


    consultarId: async (req, res) => {
      const { id } = req.params;

      try {
        const [rows] = await connection.promise().query('SELECT * FROM categoria WHERE idcategoria = ? AND eliminado = ?', [id, 0]);

        if (rows.length === 0) {
          return res.status(404).json({ message: 'Categoria no encontrada' });
        }

        res.status(200).json(rows[0]);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    },
    actualizarCategoria: async (req, res) => {
      const { id } = req.params;
      const { nombre, idcreador, idactualizacion, fechacreacion, fechaactualizacion } = req.body;

      try {
        let query = 'UPDATE categoria SET ';
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


        if (fechaactualizacion) {
          updates.push('fechaactualizacion = ?');
          params.push(fechaactualizacion);
        }
        if (updates.length === 0) {
          return res.status(400).json({ message: 'Sin información' });
        }

        query += updates.join(', ') + ' WHERE idcategoria = ?';
        params.push(id);

        const [result] = await connection.promise().query(query, params);

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Categoría no encontrado' });
        }

        res.status(200).json({ message: 'Categoría actualizado exitosamente' });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    },
    eliminarCategoria: async (req, res) => {
      const { id } = req.params;

      try {

        const [result] = await connection.promise().query(
          'UPDATE categoria SET eliminado = ? WHERE idcategoria = ?',
          [1, id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Categoria no encontrada' });
        }

        res.status(200).json({ message: 'Categoria eliminada lógicamente' });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    }
  };
};