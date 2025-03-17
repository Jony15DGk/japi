const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (roles = []) => {
  return (req, res, next) => {
  
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

   
    if (token == null) {
      return res.status(401).json({ message: 'Acceso denegado: Token no proporcionado' });
    }

   
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Acceso denegado: Token inválido o expirado' });
      }

      
      if (roles.length > 0 && !roles.includes(user.rol)) { 
        return res.status(403).json({ message: 'Acceso denegado: No tienes permisos suficientes' });
      }
      

      
      req.user = user;
      next(); 
    });
  };
};

module.exports = authenticateToken;