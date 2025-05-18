const admin = require('firebase-admin');

// Para depuración, verifica cómo se están cargando las variables
console.log('Inicializando Firebase con:', {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Evita mostrar demasiado de la clave privada
  privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length,
});

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Manejo más robusto de la clave privada
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase inicializado correctamente');
  }
} catch (error) {
  console.error('Error al inicializar Firebase:', error);
}


module.exports = admin;

