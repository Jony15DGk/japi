const { getToken, getTokenData, decodeTokenSinVerificar } = require('../config/jwt.config');
const { getTemplate, sendEmail } = require('../config/mail.config');
const authenticateToken = require('../middleware/auth');
const jwt = require('jsonwebtoken');

require('dotenv').config();
module.exports = (connection) => {
  return {
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
      const { rol_idrol, email, password, fechacreacion, fechaactualizacion, idcreador, idactualizacion } = req.body;

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

        if (password) {
          const hashedPasswordBinary = Buffer.from(password, 'utf8');
          updates.push('password= ?');
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
      const { email, password } = req.body;
    
      try {
        const [rows] = await connection.promise().query(
          `SELECT idusuario, cliente.nombre as nombrecliente, rol.nombre, rol_idrol, email, password, estatus 
           FROM usuario 
           INNER JOIN rol ON usuario.rol_idrol = rol.idrol 
           INNER JOIN cliente ON cliente.usuario_idusuario = usuario.idusuario 
           WHERE email = ? AND usuario.eliminado = 0`,
          [email]
        );
    
        if (rows.length === 0) {
          return res.status(401).json({success: false, emailExists: false,  pending:false});
        }
    
        const user = rows[0];
        const storedPassword = user.password.toString('utf8').replace(/\x00/g, '');
    
        console.log('Contraseña almacenada:', storedPassword);
        console.log('Contraseña ingresada:', password);
    
        if (password !== storedPassword) {
          return res.status(401).json({ 
            success:false,
            emailExists: true, 
            pending: user.estatus === 0 ? true : false 
          });
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
          },
          success: true,
          emailExists: true,
          pending: user.estatus === 0 ? true : false
        });
    
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error en el servidor' });
      }
    }
    ,
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
        // Verificar si el refreshToken es válido y está activo
        const [rows] = await connection.promise().query(
          'SELECT usuario_idusuario FROM refreshtoken WHERE token = ? AND fechaexpiracion > NOW() AND eliminado = 0',
          [refreshToken]
        );
    
        if (rows.length === 0) {
          return res.status(403).json({ message: 'Refresh token inválido, expirado o eliminado' });
        }
    
        const { usuario_idusuario } = rows[0];
    
        
        const [userRows] = await connection.promise().query(
          `SELECT idusuario, cliente.nombre AS nombrecliente, rol.nombre AS rol, rol_idrol, email, estatus
           FROM usuario
           INNER JOIN rol ON usuario.rol_idrol = rol.idrol
           INNER JOIN cliente ON cliente.usuario_idusuario = usuario.idusuario
           WHERE idusuario = ? AND usuario.eliminado = 0`,
          [usuario_idusuario]
        );
    
        if (userRows.length === 0) {
          return res.status(403).json({ message: 'Usuario no encontrado o eliminado' });
        }
    
        const user = userRows[0];
    
        
        const accessToken = jwt.sign(
          { idusuario: user.idusuario, email: user.email, rol_idrol: user.rol_idrol, nombrecliente: user.nombrecliente, rol: user.rol },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '15m' }
        );
    
       
        res.json({
          accessToken,
          user: {
            idusuario: user.idusuario,
            nombrecliente: user.nombrecliente,
            email: user.email,
            rol_idrol: user.rol_idrol,
            rol: user.rol
          },
          success: true
        });
    
      } catch (error) {
        console.error('Error al refrescar el token:', error);
        res.status(500).json({ message: 'Error en el servidor' });
      }
    }
    ,
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
      const { email, password, idcreador } = req.body;

      try {

        const [roles] = await connection.promise().query(
          'SELECT idrol FROM rol WHERE nombre = ?',
          ['Superusuario']
        );

        if (roles.length === 0) {
          return res.status(400).json({ message: 'El rol Superusuario no existe' });
        }

        const rol_idrol = roles[0].idrol;
        const hashedPasswordBinary = Buffer.from(password, 'utf8');


        const [result] = await connection.promise().query(
          'INSERT INTO usuario (rol_idrol, email, password, fechacreacion, fechaactualizacion, idcreador, idactualizacion, eliminado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
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

    }, actualizarsuperusuario: async (req, res) => {
      const { id } = req.params;
      const { rol_idrol, email, password, fechacreacion, fechaactualizacion, idcreador, idactualizacion } = req.body;

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

        if (password) {
          const hashedPasswordBinary = Buffer.from(password, 'utf8');
          updates.push('password = ?');
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
    }, confirmarUsuario: async (req, res) => {
      const connectionPromise = connection.promise();
      try {
        const { token } = req.params;
        const data = await getTokenData(token);
    
        if (!data || !data.data || !data.data.email) {
          const decoded = decodeTokenSinVerificar(token); 
          const email = decoded?.data?.email;
          
          if (email) {
            const [usuarios] = await connectionPromise.query(
              'SELECT idusuario, estatus FROM usuario WHERE email = ?',
              [email]
            );
        
            if (usuarios.length > 0) {
              const usuario = usuarios[0];
              
              if (usuario.estatus === 0) {
                const newToken = await getToken({ email }); 
                
                const template = getTemplate(email, newToken);
                await sendEmail(email, 'Confirmación de correo', template);
              }
            }
          }
        
          return res.status(400).json({
            success: false,
            emailExists: true,
            pending:true
          });
        }
        
    
        const email = data.data.email;
    
        const [usuarios] = await connectionPromise.query(
          'SELECT idusuario, estatus FROM usuario WHERE email = ?',
          [email]
        );
    
        if (usuarios.length === 0) {
          return res.status(404).json({ success: false, emailExists:false, pending:true });
        }
    
        const usuario = usuarios[0];
        if (usuario.estatus === 1) {
          return res.json({ success: true, emailExists:true, pending:false });
        }
    
        await connectionPromise.query(
          'UPDATE usuario SET estatus = 1 WHERE email = ?',
          [email]
        );
    
        return res.json({ success: true, emailExists:true, pending:false });
    
      } catch (error) {
        console.error('Error al confirmar usuario:', error);
        return res.status(500).json({
          success: false,
          msg: 'Error al confirmar usuario'
        });
      }
    }, vendedor: async (req, res) => {
      const {
        email,
        password,
        nombre,
        telefono
      } = req.body;
    
      const connectionPromise = connection.promise();
    
      try {
        const [roles] = await connection.promise().query(
          'SELECT idrol FROM rol WHERE nombre = ?',
          ['Vendedor']
        );

        if (roles.length === 0) {
          return res.status(400).json({ message: 'El rol vendedor no existe' });
        }

        const rol_idrol = roles[0].idrol;

    
        const [emailResult] = await connectionPromise.query(
          'SELECT idusuario, estatus FROM usuario WHERE email = ?',
          [email]
        );
    
        if (emailResult.length > 0) {
          const user = emailResult[0];
          if (user.estatus === 0) {
            return res.status(400).json({  success: false,
              emailExists: true,
              pending: true });
          } else {
            
            return res.status(400).json({ success: false,
              emailExists: true,
              pending: false });
          }
        }
    
        const hashedPasswordBinary = Buffer.from(password, 'utf8');
    
        const [usuarioResult] = await connectionPromise.query(
          'INSERT INTO usuario (rol_idrol, email, password, fechacreacion, fechaactualizacion, idcreador, idactualizacion, eliminado, estatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [rol_idrol, email, hashedPasswordBinary, new Date(), null, null, null, 0, 0] 
        );
    
        const usuarioId = usuarioResult.insertId;
    
        await connectionPromise.query(
          'UPDATE usuario SET idcreador = ? WHERE idusuario = ?',
          [usuarioId, usuarioId]
        );
    
        await connectionPromise.query(
          'INSERT INTO cliente (usuario_idusuario, nombre, telefono, eliminado) VALUES (?, ?, ?, ?)',
          [usuarioId, nombre, telefono, 0]
        );
    
        const token = getToken({ email });
        const template = getTemplate(nombre, token);
        await sendEmail(email, 'Confirmación de correo', template);
    
        res.status(201).json({
          success: true,
              emailExists: false,
              pending: true,
              message: 'Vendedor registrado'
        });
    
      } catch (error) {
        console.error('Error inesperado:', error);
        return res.status(500).json({ message: 'Error al registrar usuario/cliente' });
      }
    },administrador: async (req, res) => {
      const {
        email,
        password,
        nombre,
        telefono
      } = req.body;
    
      const connectionPromise = connection.promise();
    
      try {
        const [roles] = await connection.promise().query(
          'SELECT idrol FROM rol WHERE nombre = ?',
          ['Administrador']
        );

        if (roles.length === 0) {
          return res.status(400).json({ message: 'El rol administrador no existe' });
        }

        const rol_idrol = roles[0].idrol;

    
        const [emailResult] = await connectionPromise.query(
          'SELECT idusuario, estatus FROM usuario WHERE email = ?',
          [email]
        );
    
        if (emailResult.length > 0) {
          const user = emailResult[0];
          if (user.estatus === 0) {
            return res.status(400).json({  success: false,
              emailExists: true,
              pending: true });
          } else {
            
            return res.status(400).json({ success: false,
              emailExists: true,
              pending: false });
          }
        }
    
        const hashedPasswordBinary = Buffer.from(password, 'utf8');
    
        const [usuarioResult] = await connectionPromise.query(
          'INSERT INTO usuario (rol_idrol, email, password, fechacreacion, fechaactualizacion, idcreador, idactualizacion, eliminado, estatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [rol_idrol, email, hashedPasswordBinary, new Date(), null, null, null, 0, 0] 
        );
    
        const usuarioId = usuarioResult.insertId;
    
        await connectionPromise.query(
          'UPDATE usuario SET idcreador = ? WHERE idusuario = ?',
          [usuarioId, usuarioId]
        );
    
        await connectionPromise.query(
          'INSERT INTO cliente (usuario_idusuario, nombre, telefono, eliminado) VALUES (?, ?, ?, ?)',
          [usuarioId, nombre, telefono, 0]
        );
    
        const token = getToken({ email });
        const template = getTemplate(nombre, token);
        await sendEmail(email, 'Confirmación de correo', template);
    
        res.status(201).json({
          success: true,
              emailExists: false,
              pending: true,
              message: 'Administrador registrado'
        });
    
      } catch (error) {
        console.error('Error inesperado:', error);
        return res.status(500).json({ message: 'Error al registrar usuario/cliente' });
      }
    },usuario: async (req, res) => {
      const {
        email,
        password,
        nombre,
        telefono
      } = req.body;
    
      const db = connection.promise();
      const cleanEmail = email.trim().toLowerCase();

      try {
        const [roles] = await connection.promise().query(
          'SELECT idrol FROM rol WHERE nombre = ?',
          ['Usuario']
        );

        if (roles.length === 0) {
          console.log('Correo encontrado:', emailResult);
          return res.status(400).json({ success: false,
            emailExists: true,
            pending: false });
        }

        const rol_idrol = roles[0].idrol;

    
        const [emailResult] = await db.query(
          'SELECT idusuario, estatus FROM usuario WHERE email = ?',
          [cleanEmail]
        );
    
        if (emailResult.length > 0) {
          const user = emailResult[0];
          console.log('Correo encontrado:', emailResult);
          if (user.estatus === 0) {
            return res.status(400).json({  success: false,
              emailExists: true,
              pending: true });
          } else {
            
            return res.status(400).json({ success: false,
              emailExists: true,
              pending: false });
          }
        }
    
        const hashedPasswordBinary = Buffer.from(password, 'utf8');
    
        const [usuarioResult] = await db.query(
          'INSERT INTO usuario (rol_idrol, email, password, fechacreacion, fechaactualizacion, idcreador, idactualizacion, eliminado, estatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [rol_idrol, cleanEmail, hashedPasswordBinary, new Date(), null, null, null, 0, 0] 
        );
    
        const usuarioId = usuarioResult.insertId;
    
        await db.query(
          'UPDATE usuario SET idcreador = ? WHERE idusuario = ?',
          [usuarioId, usuarioId]
        );
    
        await db.query(
          'INSERT INTO cliente (usuario_idusuario, nombre, telefono, eliminado) VALUES (?, ?, ?, ?)',
          [usuarioId, nombre, telefono, 0]
        );
    
        const token = getToken({ email });
        const template = getTemplate(nombre, token);
        await sendEmail(email, 'Confirmación de correo', template);
    
        res.status(201).json({
          success: true,
              emailExists: false,
              pending: true,
              message: 'Administrador registrado'
        });
    
      } catch (error) {
        console.error('Error inesperado:', error);
        return res.status(500).json({ message: 'Error al registrar usuario/cliente' });
      }
    }
    
    



  };
};