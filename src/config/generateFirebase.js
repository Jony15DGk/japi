const fs = require('fs'); 

const json = JSON.parse(fs.readFileSync('src/config/notificaciones-fbcm.json', 'utf8'));

console.log(`FIREBASE_PROJECT_ID=${json.project_id}`);
console.log(`FIREBASE_CLIENT_EMAIL=${json.client_email}`);
console.log(`FIREBASE_PRIVATE_KEY=${json.private_key.replace(/\n/g, '\\n')}`);

