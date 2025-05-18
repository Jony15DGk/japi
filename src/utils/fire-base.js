const admin = require('firebase-admin');

try {
  // Verifica si ya hay una instancia inicializada
  if (!admin.apps.length) {
    // Limpia el email de caracteres no deseados
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL.trim().replace(/^\s*[=\t]+/, '');
    
    // Asegúrate de que la clave privada tenga el formato correcto
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      // Si la clave no tiene el formato correcto, intenta recuperarlo
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey.replace(/[^A-Za-z0-9+/=]/g, '')}\n-----END PRIVATE KEY-----\n`;
    }
    
    console.log('Inicializando Firebase con:', {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: clientEmail,
      privateKeyFormat: privateKey.substring(0, 27) + '...'
    });
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: clientEmail,
        privateKey: privateKey
      })
    });
    console.log('Firebase inicializado correctamente');
  }
} catch (error) {
  console.error('Error al inicializar Firebase:', error);
}

module.exports = admin;


