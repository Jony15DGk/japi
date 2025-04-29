const jwt = require('jsonwebtoken');

const getToken=(payload)=>{
    return jwt.sign({
       data:payload
    },process.env.JWT_SECRET,{expiresIn: '1h'});
}

const getTokenData = (token) => {
  return new Promise((resolve) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => { 
      if (err) {
        console.log('Error al obtener data del token');
        return resolve(null);
      } else {
        return resolve(decoded);
      }
    });
  });
};


const  decodeTokenSinVerificar=(token)=>{
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }

}
  

module.exports ={
    getToken,
    getTokenData,
    decodeTokenSinVerificar
}