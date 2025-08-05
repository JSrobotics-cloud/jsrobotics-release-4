// lib/firebase.js
import admin from 'firebase-admin';

let firebaseInitialized = false;

export function initializeFirebase() {
    if (firebaseInitialized) {
        // console.log("Firebase Admin already initialized");
        return;
    }

    try {
        // Vercel recommends using environment variables for secrets
        // Store your service account JSON as a single environment variable
        // e.g., FIREBASE_SERVICE_ACCOUNT_KEY = "{...json content...}"
        const serviceAccountJson = process.env.FIREBASE_ADMIN_KEY;
        if (!serviceAccountJson) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
        }

        const serviceAccount = JSON.parse(serviceAccountJson);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: 'jsrobotics-cloud-storage.firebasestorage.app'
        });

        firebaseInitialized = true;
        console.log("Firebase Admin SDK initialized");
    } catch (error) {
        console.error("Failed to initialize Firebase Admin SDK:", error.message);
        // Depending on your app's requirements, you might want to throw here
        // or handle gracefully if Firebase is optional for some functions.
        // throw error;
    }
}

// Ensure Firebase is initialized before getting the bucket
export const getBucket = () => {
    if (!firebaseInitialized) {
        throw new Error("Firebase Admin SDK not initialized. Call initializeFirebase() first.");
    }
    return admin.storage().bucket();
};

// Helper function to upload files (buffer) to Firebase Storage
export async function uploadToFirebase(fileBuffer, originalName, folder = 'uploads') {
    if (!firebaseInitialized) {
        throw new Error("Firebase Admin SDK not initialized. Call initializeFirebase() first.");
    }
    if (!fileBuffer || !originalName) {
        throw new Error("File buffer and original name are required for upload.");
    }

    try {
        const fileName = `${folder}/${Date.now()}-${originalName.replace(/\s+/g, '_')}`;
        const bucket = getBucket();
        const fileUpload = bucket.file(fileName);

        const stream = fileUpload.createWriteStream({
            metadata: {
                contentType: 'application/octet-stream' // Default, can be overridden
            }
        });

        return new Promise((resolve, reject) => {
            stream.on('error', (err) => {
                console.error("Firebase upload stream error:", err);
                reject(new Error(`Firebase upload failed: ${err.message}`));
            });
            stream.on('finish', async () => {
                try {
                    // Make the file publicly readable
                    await fileUpload.makePublic();
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                    console.log(`File uploaded successfully: ${publicUrl}`);
                    resolve(publicUrl);
                } catch (err) {
                    console.error("Error making file public:", err);
                    reject(new Error(`Failed to make file public: ${err.message}`));
                }
            });
            stream.end(fileBuffer);
        });
    } catch (error) {
        console.error("Error in uploadToFirebase:", error);
        throw new Error(`Upload process failed: ${error.message}`);
    }
}