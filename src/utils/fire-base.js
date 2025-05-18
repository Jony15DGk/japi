const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

console.log('EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Cargada' : 'Vacía');


module.exports = admin;

