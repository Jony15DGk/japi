const authenticateToken = require('../middleware/auth');
const jwt = require('jsonwebtoken');
require('dotenv').config();
module.exports = (connection) => {
  return {
    usuario: async (req, res) => {
      const { rol_idrol, email, contraseña, idcreador } = req.body;

      try {

        const [rolResult] = await connection.promise().query(
          'SELECT nombre FROM rol WHERE idrol = ?',
          [rol_idrol]
        );

        if (rolResult.length === 0) {
          return res.status(400).json({ message: 'El rol especificado no existe' });
        }

        const nombreRol = rolResult[0].nombre;


        const [creadorRolResult] = await connection.promise().query(
          'select nombre from rol where idrol  = ?',
          [rol_idrol]
        );

        if (creadorRolResult.length === 0) {
          return res.status(400).json({ message: 'El creador especificado no existe' });
        }

        const nombreRolCreador = creadorRolResult[0].nombre;


        if (nombreRol === 'Superusuario' && nombreRolCreador !== 'Superusuario') {
          return res.status(403).json({ message: 'Solo los superusuarios pueden crear Superusuarios' });
        }

        const hashedPasswordBinary = Buffer.from(contraseña, 'utf8');

        const [result] = await connection.promise().query(
          'INSERT INTO usuario (rol_idrol, email, contraseña, fechacreacion, fechaactualizacion, idcreador, idactualizacion, eliminado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [rol_idrol, email, hashedPasswordBinary, new Date(), null, idcreador, null, 0]
        );

        res.status(201).json({ message: 'Usuario registrado', userId: result.insertId });
      } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error al registrar usuario' });
      }
    },
    consultar: async (req, res) => {
      try {
        const [rows] = await connection.promise().query('SELECT * FROM usuario WHERE eliminado = ?', [0]);
        res.status(200).json(rows);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    },


    consultarId: async (req, res) => {
      const { id } = req.params;

      try {
        const [rows] = await connection.promise().query('SELECT * FROM usuario WHERE idusuario = ? AND eliminado = ?', [id, 0]);

        if (rows.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(rows[0]);
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    },
    actualizarUsuario: async (req, res) => {
      const { id } = req.params;
      const { rol_idrol, email, contraseña, fechacreacion, fechaactualizacion, idcreador, idactualizacion } = req.body;

      try {
        const [rows] = await connection.promise().query(
          'SELECT rol_idrol FROM usuario WHERE idusuario = ?',
          [id]
        );
    
        if (rows.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
        }
    
        //const { rol_idrol } = rows[0];
    
        const [roles] = await connection.promise().query(
          'SELECT idrol FROM rol WHERE nombre = "Superusuario"'
        );
    
        if (roles.length > 0 && rol_idrol === roles[0].idrol) {
          return res.status(403).json({ message: 'No puedes eliminar un superusuario' });
        }

        let query = 'UPDATE usuario SET ';
        const updates = [];
        const params = [];

        if (rol_idrol) {
          updates.push('rol_idrol = ?');
          params.push(rol_idrol);
        }

        if (email) {
          updates.push('email = ?');
          params.push(email);
        }

        if (contraseña) {
          const hashedPasswordBinary = Buffer.from(contraseña, 'utf8');
          updates.push('contraseña = ?');
          params.push(hashedPasswordBinary);
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

        query += updates.join(', ') + ' WHERE idusuario = ?';
        params.push(id);

        const [result] = await connection.promise().query(query, params);

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Usuario no econtrado' });
        }

        res.status(200).json({ message: 'Usuario actualizado exitosamente' });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    },
    login: async (req, res) => {
      const { email, contraseña } = req.body;

      try {
        const [rows] = await connection.promise().query(
          `SELECT idusuario, cliente.nombre as nombrecliente, rol.nombre, rol_idrol, email, contraseña 
           FROM usuario 
           INNER JOIN rol ON usuario.rol_idrol = rol.idrol 
           INNER JOIN cliente ON cliente.usuario_idusuario = usuario.idusuario 
           WHERE email = ? AND usuario.eliminado = 0`,
          [email]
        );

        if (rows.length === 0) {
          return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }

        const user = rows[0];
        const storedPassword = user.contraseña.toString('utf8').replace(/\x00/g, '');

        console.log('Contraseña almacenada:', storedPassword);
        console.log('Contraseña ingresada:', contraseña);

        if (contraseña !== storedPassword) {
          return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }

        const accessToken = jwt.sign(
          { idusuario: user.idusuario, email: user.email, rol_idrol: user.rol_idrol, nombrecliente: user.nombrecliente, rol: user.nombre },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
          { idusuario: user.idusuario, email: user.email, rol_idrol: user.rol_idrol, nombrecliente: user.nombrecliente, rol: user.nombre },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: '7d' }
        );


        const fechaexpiracion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const fechacreacion = new Date(Date.now());

        await connection.promise().query(
          'INSERT INTO refreshtoken (usuario_idusuario, token, fechaexpiracion, fechacreacion, eliminado) VALUES (?, ?, ?, ?, ?)',
          [user.idusuario, refreshToken, fechaexpiracion, fechacreacion, 0]
        );

        res.json({
          accessToken,
          refreshToken,
          user: {
            idusuario: user.idusuario,
            nombrecliente: user.nombrecliente,
            email: user.email,
            rol_idrol: user.rol_idrol,
            rol: user.nombre
          }
        });

      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error en el servidor' });
      }
    },
    eliminarUsuario: async (req, res) => {
      const { id } = req.params;

      try {
        const [rows] = await connection.promise().query(
          'SELECT rol_idrol FROM usuario WHERE idusuario = ?',
          [id]
        );

        if (rows.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const { rol_idrol } = rows[0];


        const [roles] = await connection.promise().query(
          'SELECT idrol FROM rol WHERE nombre = "Superusuario"'
        );

        if (roles.length > 0 && rol_idrol === roles[0].idrol) {
          return res.status(403).json({ message: 'No puedes eliminar un superusuario' });
        }
        const [result] = await connection.promise().query(
          'UPDATE usuario SET eliminado = ? WHERE idusuario = ?',
          [true, id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({ message: 'Usuario eliminado lógicamente' });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    },
    refreshToken: async (req, res) => {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token no proporcionado' });
      }

      try {
        const [rows] = await connection.promise().query(
          'SELECT * FROM refreshtoken WHERE token = ? AND fechaexpiracion > NOW() AND eliminado = 0',
          [refreshToken]
        );

        if (rows.length === 0) {
          return res.status(403).json({ message: 'Refresh token inválido, expirado o eliminado' });
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
          if (err) {
            return res.status(403).json({ message: 'Refresh token inválido o expirado' });
          }

          const accessToken = jwt.sign(
            { idusuario: user.idusuario, email: user.email, rol_idrol: user.rol_idrol, nombre: user.nombre },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
          );

          res.json({ accessToken });
        });
      } catch (error) {
        console.error('Error al refrescar el token:', error);
        res.status(500).json({ message: 'Error en el servidor' });
      }
    },
    logout: async (req, res) => {
      console.log('Logout iniciado');
      const { refreshToken } = req.body;
      console.log('RefreshToken recibido:', refreshToken);
      if (!refreshToken || refreshToken.trim() === '') {
        console.log('RefreshToken inválido');
        return res.status(400).json({ message: 'Refresh token inválido' });
      }
      try {
        const [result] = await connection.promise().query(
          'DELETE FROM refreshtoken WHERE token = ?',
          [refreshToken]
        );
        console.log('Resultado de la consulta:', result);
        if (result.affectedRows === 0) {
          console.log('Refresh token no encontrado en la base de datos');
          return res.status(404).json({ message: 'Refresh token no encontrado' });
        }
        console.log('Sesión cerrada exitosamente');

        return res.json({ exito: true });
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ message: 'Error en el servidor' });
      }
    }, superusuario: async (req, res) => {
      const { email, contraseña, idcreador } = req.body;

      try {

        const [roles] = await connection.promise().query(
          'SELECT idrol FROM rol WHERE nombre = ?',
          ['Superusuario']
        );

        if (roles.length === 0) {
          return res.status(400).json({ message: 'El rol Superusuario no existe' });
        }

        const rol_idrol = roles[0].idrol;
        const hashedPasswordBinary = Buffer.from(contraseña, 'utf8');


        const [result] = await connection.promise().query(
          'INSERT INTO usuario (rol_idrol, email, contraseña, fechacreacion, fechaactualizacion, idcreador, idactualizacion, eliminado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [rol_idrol, email, hashedPasswordBinary, new Date(), null, idcreador, null, 0]
        );

        res.status(201).json({ message: 'Usuario registrado', userId: result.insertId });
      } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error al registrar usuario' });
      }
    },
    eliminarsuperusuario: async (req, res) => {
      const { id } = req.params;

      try {

        const [rows] = await connection.promise().query(
          'SELECT rol_idrol FROM usuario WHERE idusuario = ?',
          [id]
        );

        if (rows.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
        }


        const [result] = await connection.promise().query(
          'UPDATE usuario SET eliminado = ? WHERE idusuario = ?',
          [true, id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({ message: 'Usuario eliminado lógicamente' });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error en el servidor' });
      }

    },  actualizarsuperusuario: async (req, res) => {
      const { id } = req.params;
      const { rol_idrol, email, contraseña, fechacreacion, fechaactualizacion, idcreador, idactualizacion } = req.body;

      try {
        const [rows] = await connection.promise().query(
          'SELECT rol_idrol FROM usuario WHERE idusuario = ?',
          [id]
        );
    
        if (rows.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
        }
  

        let query = 'UPDATE usuario SET ';
        const updates = [];
        const params = [];

        if (rol_idrol) {
          updates.push('rol_idrol = ?');
          params.push(rol_idrol);
        }

        if (email) {
          updates.push('email = ?');
          params.push(email);
        }

        if (contraseña) {
          const hashedPasswordBinary = Buffer.from(contraseña, 'utf8');
          updates.push('contraseña = ?');
          params.push(hashedPasswordBinary);
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

        query += updates.join(', ') + ' WHERE idusuario = ?';
        params.push(id);

        const [result] = await connection.promise().query(query, params);

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Usuario no econtrado' });
        }

        res.status(200).json({ message: 'Usuario actualizado exitosamente' });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error' });
      }
    }



  };
};