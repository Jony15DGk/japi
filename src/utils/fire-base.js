const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

try {
  if (!admin.apps.length) {
    // Usar rutas relativas con __dirname
    const serviceAccountPath = path.join(__dirname, '../config/notificaciones-fbcm.json');
    console.log('Buscando archivo en:', serviceAccountPath);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('Archivo de configuración no encontrado en:', serviceAccountPath);
      console.log('Contenido del directorio:', fs.readdirSync(path.join(__dirname, '../config')));
      throw new Error('Archivo de configuración no encontrado');
    }
    
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
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


