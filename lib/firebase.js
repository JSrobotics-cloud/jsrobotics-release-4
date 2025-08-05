// lib/firebase.js
import admin from 'firebase-admin';

let firebaseInitialized = false;

export function initializeFirebase() {
    if (firebaseInitialized) {
        return;
    }

    try {
        const serviceAccountJson = process.env.FIREBASE_ADMIN_KEY; // Matches your Vercel env var name
        if (!serviceAccountJson) {
            throw new Error('FIREBASE_ADMIN_KEY environment variable is not set.');
        }

        const serviceAccount = JSON.parse(serviceAccountJson);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: 'jsrobotics-cloud-storage.firebasestorage.app' // Your correct bucket
        });

        firebaseInitialized = true;
        console.log("Firebase Admin SDK initialized");
    } catch (error) {
        console.error("Failed to initialize Firebase Admin SDK:", error.message);
        // Re-throwing might make the immediate failure clearer in logs
        // when initializeFirebase is called.
        // throw error;
        // Or, store the error to re-throw later if needed.
    }
}

export const getBucket = () => {
    if (!firebaseInitialized) {
        throw new Error("Firebase Admin SDK not initialized. Call initializeFirebase() first.");
    }
    return admin.storage().bucket();
};

export async function uploadToFirebase(fileBuffer, originalName, folder = 'uploads') {
    // Redundant check, getBucket also checks, but okay.
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
                contentType: 'application/octet-stream' // Default, consider using actual MIME type
            }
        });

        return new Promise((resolve, reject) => {
            stream.on('error', (err) => {
                console.error("Firebase upload stream error:", err);
                reject(new Error(`Firebase upload failed: ${err.message}`));
            });
            stream.on('finish', async () => {
                try {
                    await fileUpload.makePublic();
                    // --- FIXED: Removed extra spaces in the URL ---
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