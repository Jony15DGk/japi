
module.exports = (connection) => {
    return {
      consultar: async (req, res) => {
        try {
          const [rows] = await connection.promise().query('SELECT * FROM matriz WHERE eliminado = ?', [0]);
          res.status(200).json(rows);
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ message: 'Error' });
        }
  
      },
  
      consultarId: async (req, res) => {
        const { id } = req.params;
  
        try {
          const [rows] = await connection.promise().query('SELECT * FROM matriz WHERE idmatriz = ? AND eliminado = ?', [id, 0]);
  
          if (rows.length === 0) {
            return res.status(404).json({ message: 'Matriz no encontrada' });
          }
  
          res.status(200).json(rows[0]);
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ message: 'Error' });
        }
      },

      crearmatriz: async (req, res) => {
        const {nombre, ubicacion, telefono, email } = req.body;
    
        try {

           
            const { lat, lng } = ubicacion;      
            const pointWKT = `POINT(${lng} ${lat})`;
    
      
            const [result] = await connection.promise().query(
              'INSERT INTO matriz (nombre, ubicacion, telefono, email,eliminado) VALUES (?, ST_GeomFromText(?), ?, ?, ?)',
              [ nombre, pointWKT, telefono, email,  0]
          );
    
            res.status(201).json({ message: 'Matriz registrada', idmatriz: result.insertId });
        } catch (error) {
            console.error('Error al registrar matriz:', error);
            res.status(500).json({ message: 'Error al registrar matriz' });
        }
    },


      actualizarMatriz: async (req, res) => {
        const { id } = req.params;
        const { idmatriz, nombre, ubicacion, telefono, email } = req.body;
  
        try {
          let query = 'UPDATE matriz SET ';
          const updates = [];
          const params = [];
  
          if (idmatriz) {
            updates.push('idmatriz = ?');
            params.push(idmatriz);
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

          if (telefono) {
            updates.push('telefono = ?');
            params.push(telefono);
          }
  
          if (updates.length === 0) {
            return res.status(400).json({ message: 'Sin información' });
          }
  
          query += updates.join(', ') + ' WHERE idmatriz = ?';
          params.push(id);
  
          const [result] = await connection.promise().query(query, params);
  
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Matriz no encontrada' });
          }
  
          res.status(200).json({ message: 'Matriz actualizada exitosamente' });
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ message: 'Error al actualizar la matriz' });
        }
      },
  
      eliminarMatriz: async (req, res) => {
        const { id } = req.params;
  
        try {
          const [result] = await connection.promise().query(
            'UPDATE matriz SET eliminado = ? WHERE idmatriz = ?',
            [true, id]
          );
  
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Matriz no encontrado' });
          }
  
          res.status(200).json({ message: 'Matriz eliminada ' });
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ message: 'Error' });
        }
      }
    };
  
  };