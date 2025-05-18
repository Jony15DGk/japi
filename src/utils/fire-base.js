const admin = require('firebase-admin');
const serviceAccount = require('../config/notificaciones-fbcm.json'); // ignorado por Git

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;


