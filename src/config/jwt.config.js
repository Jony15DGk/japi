const jwt = require('jsonwebtoken');

const getToken=(payload)=>{
    return jwt.sign({
       data:payload
    },'SECRET',{expiresIn: '1h'});
}

const getTokenData = (token) => {
    return new Promise((resolve) => {
      jwt.verify(token, 'SECRET', (err, decoded) => {
        if (err) {
          console.log('Error al obtener data del token');
          return resolve(null);
        } else {
          return resolve(decoded);
        }
      });
    });
  };
  

module.exports ={
    getToken,
    getTokenData
}