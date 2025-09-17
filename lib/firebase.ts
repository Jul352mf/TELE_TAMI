import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
function initializeFirebase() {
  if (admin.apps.length === 0) {
    const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON 
      ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
      : undefined;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      // For local development or when using default credentials
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  }
  return admin;
}

export const firebase = initializeFirebase();
export const firestore = firebase.firestore;
export const storage = firebase.storage;