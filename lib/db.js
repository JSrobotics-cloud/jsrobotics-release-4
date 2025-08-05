// lib/firebase.js
import admin from 'firebase-admin';

let firebaseInitialized = false;
let initializationError = null; // Store initialization errors

export function initializeFirebase() {
    // If already initialized successfully, do nothing
    if (firebaseInitialized) {
        // console.log("Firebase Admin SDK already initialized.");
        return;
    }

    // If there was a previous initialization attempt that failed, re-throw the error
    // This makes the failure more immediate when initializeFirebase is called.
    if (initializationError) {
        console.warn("Re-throwing previous Firebase initialization error:", initializationError.message);
        throw new Error(`Previous Firebase initialization failed: ${initializationError.message}`);
    }

    try {
        console.log("Starting Firebase Admin SDK initialization...");
        const serviceAccountJson = process.env.FIREBASE_ADMIN_KEY; // Matches your Vercel env var name
        if (!serviceAccountJson) {
            const error = new Error('FIREBASE_ADMIN_KEY environment variable is not set or is empty.');
            initializationError = error; // Store the error
            throw error;
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(serviceAccountJson);
            console.log("Parsed service account JSON successfully.");
        } catch (parseError) {
            const error = new Error(`Failed to parse FIREBASE_ADMIN_KEY JSON: ${parseError.message}`);
            initializationError = error; // Store the error
            throw error;
        }

        // Use the specific bucket name you confirmed
        const BUCKET_NAME = 'jsrobotics-cloud-storage.firebasestorage.app';
        console.log(`Initializing Firebase with bucket: ${BUCKET_NAME}`);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: BUCKET_NAME
        });

        // Test accessing the bucket to ensure it exists/config is correct
        const testBucket = admin.storage().bucket();
        console.log(`Firebase Admin SDK initialized successfully. Default bucket name: ${testBucket.name}`);

        firebaseInitialized = true;
        initializationError = null; // Clear any previous error on success
        console.log("Firebase Admin SDK is now ready for use.");

    } catch (error) {
        console.error("CRITICAL: Failed to initialize Firebase Admin SDK:", error);
        initializationError = error; // Store the error
        // Re-throw to halt execution if called directly, or let calling function handle
        throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
    }
}

// Ensure Firebase is initialized before getting the bucket
export const getBucket = () => {
    if (!firebaseInitialized) {
        // This is the error you are seeing if initialization failed silently before
        const errorMsg = "Firebase Admin SDK not initialized. Call initializeFirebase() first.";
        console.error("getBucket Error:", errorMsg);
        throw new Error(errorMsg);
    }
    return admin.storage().bucket();
};

// Helper function to upload files (buffer) to Firebase Storage
export async function uploadToFirebase(fileBuffer, originalName, folder = 'uploads') {
    // Check initialization (redundant with getBucket, but explicit)
    if (!firebaseInitialized) {
        const errorMsg = "Firebase Admin SDK not initialized. Call initializeFirebase() first.";
        console.error("uploadToFirebase Error (Init Check):", errorMsg);
        throw new Error(errorMsg);
    }
    if (!fileBuffer || !originalName) {
        const errorMsg = "File buffer and original name are required for upload.";
        console.error("uploadToFirebase Error (Args):", errorMsg);
        throw new Error(errorMsg);
    }

    try {
        const cleanOriginalName = originalName.replace(/\s+/g, '_');
        const fileName = `${folder}/${Date.now()}-${cleanOriginalName}`;
        console.log(`Preparing to upload file: ${fileName}`);

        const bucket = getBucket(); // This checks initialization again
        const fileUpload = bucket.file(fileName);

        const stream = fileUpload.createWriteStream({
            metadata: {
                contentType: 'application/octet-stream' // Default, consider using actual MIME type
            }
        });

        console.log(`Upload stream created for ${fileName}`);

        return new Promise((resolve, reject) => {
            stream.on('error', (err) => {
                console.error("Firebase upload stream error for", fileName, ":", err);
                reject(new Error(`Firebase upload failed for ${fileName}: ${err.message}`));
            });
            stream.on('finish', async () => {
                console.log(`Upload stream finished for ${fileName}. Making file public...`);
                try {
                    await fileUpload.makePublic();
                    // --- FIXED: Removed extra spaces in the URL ---
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                    console.log(`File uploaded and made public successfully: ${publicUrl}`);
                    resolve(publicUrl);
                } catch (err) {
                    console.error("Error making file public for", fileName, ":", err);
                    reject(new Error(`Failed to make file public for ${fileName}: ${err.message}`));
                }
            });
            stream.end(fileBuffer);
        });
    } catch (error) {
        console.error("Unexpected error in uploadToFirebase for", originalName, ":", error);
        throw new Error(`Upload process failed unexpectedly for ${originalName}: ${error.message}`);
    }
}

// --- IMPORTANT ---
// Consider removing this automatic call if initialization depends on env vars
// being set correctly at import time in a serverless environment.
// It's generally safer to call initializeFirebase() explicitly in your API route handlers.
// However, if it's in the lib file and always needed, this can stay.
// Just be aware that any error here will prevent the module from working.
console.log("lib/firebase.js loaded. Attempting initial initialization...");
try {
    initializeFirebase(); // Try to initialize when module loads
    console.log("Initial initializeFirebase() call completed (may have succeeded or failed silently if error was caught).");
} catch (initError) {
    // If it throws here, it means the error wasn't caught inside initializeFirebase
    // This is less likely with the improved error handling above, but good to know.
    console.error("Initial initializeFirebase() call threw an error:", initError.message);
}
// --- END IMPORTANT ---