// lib/firebase.js
import admin from 'firebase-admin';

let firebaseInitialized = false;
let initializationError = null; // Store initialization errors

export function initializeFirebase() {
    if (firebaseInitialized) return;

    if (initializationError) {
        console.warn("Re-throwing previous Firebase initialization error:", initializationError.message);
        throw new Error(`Previous Firebase initialization failed: ${initializationError.message}`);
    }

    try {
        console.log("Starting Firebase Admin SDK initialization...");

        const base64Key = process.env.FIREBASE_ADMIN_KEY;
        if (!base64Key) {
            const error = new Error('FIREBASE_ADMIN_KEY environment variable is not set or is empty.');
            initializationError = error;
            throw error;
        }

        let serviceAccount;
        try {
            const decodedJson = Buffer.from(base64Key, 'base64').toString('utf8');
            serviceAccount = JSON.parse(decodedJson);
            console.log("Decoded and parsed service account JSON successfully.");
        } catch (parseError) {
            const error = new Error(`Failed to decode/parse FIREBASE_ADMIN_KEY: ${parseError.message}`);
            initializationError = error;
            throw error;
        }

        const BUCKET_NAME = 'jsrobotics-cloud-storage.appspot.com';
        console.log(`Initializing Firebase with bucket: ${BUCKET_NAME}`);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: BUCKET_NAME
        });

        const testBucket = admin.storage().bucket();
        console.log(`Firebase Admin SDK initialized successfully. Default bucket name: ${testBucket.name}`);

        firebaseInitialized = true;
        initializationError = null;
    } catch (error) {
        console.error("CRITICAL: Failed to initialize Firebase Admin SDK:", error);
        initializationError = error;
        throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
    }
}

export const getBucket = () => {
    if (!firebaseInitialized) {
        const errorMsg = "Firebase Admin SDK not initialized. Call initializeFirebase() first.";
        console.error("getBucket Error:", errorMsg);
        throw new Error(errorMsg);
    }
    return admin.storage().bucket();
};

export async function uploadToFirebase(fileBuffer, originalName, folder = 'uploads') {
    if (!firebaseInitialized) {
        throw new Error("Firebase Admin SDK not initialized. Call initializeFirebase() first.");
    }
    if (!fileBuffer || !originalName) {
        throw new Error("File buffer and original name are required for upload.");
    }

    try {
        const cleanOriginalName = originalName.replace(/\s+/g, '_');
        const fileName = `${folder}/${Date.now()}-${cleanOriginalName}`;
        console.log(`Preparing to upload file: ${fileName}`);

        const bucket = getBucket();
        const fileUpload = bucket.file(fileName);

        const stream = fileUpload.createWriteStream({
            metadata: { contentType: 'application/octet-stream' }
        });

        return new Promise((resolve, reject) => {
            stream.on('error', (err) => {
                reject(new Error(`Firebase upload failed for ${fileName}: ${err.message}`));
            });
            stream.on('finish', async () => {
                try {
                    await fileUpload.makePublic();
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                    resolve(publicUrl);
                } catch (err) {
                    reject(new Error(`Failed to make file public for ${fileName}: ${err.message}`));
                }
            });
            stream.end(fileBuffer);
        });
    } catch (error) {
        throw new Error(`Upload process failed unexpectedly for ${originalName}: ${error.message}`);
    }
}

console.log("lib/firebase.js loaded. Attempting initial initialization...");
try {
    initializeFirebase();
    console.log("Initial initializeFirebase() call completed.");
} catch (initError) {
    console.error("Initial initializeFirebase() call threw an error:", initError.message);
}
