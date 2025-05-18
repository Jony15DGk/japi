const admin = require('firebase-admin');

// Para depuración
console.log('Server time:', new Date().toISOString());
console.log('Inicializando Firebase con:', {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Solo mostramos si la clave existe, no su contenido
  privateKeyExists: !!process.env.FIREBASE_PRIVATE_KEY,
});

try {
  if (!admin.apps.length) {
    // Otra opción: usa directamente el archivo JSON si es posible
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase inicializado correctamente');
  }
} catch (error) {
  console.error('Error al inicializar Firebase:', error);
}

