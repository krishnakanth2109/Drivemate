import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  // Convert escaped newlines if passed in .env
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length && projectId && clientEmail && privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    console.log(`🔥 [Firebase Admin] Initialized from .env for project: ${projectId}`);
  } catch (err) {
    console.error('❌ [Firebase Admin] Initialization failed:', err.message);
  }
}

export const auth = admin.apps.length ? admin.auth() : null;
export { admin };
export default admin;
