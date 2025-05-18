const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

try {
  if (!admin.apps.length) {
    // Opción 1: Usar un archivo JSON local
    const serviceAccountPath = path.join(__dirname, 'src/config/notificaciones-fbcm.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    // Opción 2: Si estás en un entorno como Railway donde puedes cargar el contenido del JSON como variable
    // const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
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


