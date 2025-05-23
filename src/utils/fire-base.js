const admin = require('firebase-admin');

try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
    
    console.log('Inicializando Firebase con:', {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email
    });
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase inicializado correctamente');
  }
} catch (error) {
  console.error('Error al inicializar Firebase:', error);
}

module.exports = admin;


