// api/upload.js
import { initializeFirebase, uploadToFirebase } from '../lib/firebase.js';
import { authenticateToken } from '../lib/auth.js';
import formidable from 'formidable';
import fs from 'fs/promises';

initializeFirebase();

export const config = {
  api: {
    bodyParser: false,
  },
};

// This endpoint allows uploading any single file, useful for general admin tasks
// It requires authentication.
export default authenticateToken(async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    try {
        // --- Parse multipart form data ---
        const form = formidable({
            multiples: false, // Expect a single file
            // maxFileSize: 100 * 1024 * 1024, // 100MB limit (adjust)
        });

        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.error("Formidable parsing error:", err);
                    reject(new Error(`Error parsing upload: ${err.message}`));
                } else {
                    resolve({ fields, files });
                }
            });
        });

        // --- Get the uploaded file ---
        // The form field name for the file input is expected to be 'file'
        const uploadedFile = files.file;
        if (!uploadedFile) {
            return res.status(400).json({ error: 'No file uploaded. Please use the field name "file".' });
        }

        // --- Read file buffer ---
        let fileBuffer;
        if (uploadedFile.filepath) {
            fileBuffer = await fs.readFile(uploadedFile.filepath);
        } else if (uploadedFile.buffer) {
            fileBuffer = uploadedFile.buffer;
        } else {
            throw new Error("Uploaded file data (buffer or path) not found");
        }

        const originalName = uploadedFile.originalFilename || 'uploaded_file.dat';
        // Optional: Get folder from fields, default to 'uploads'
        const folder = (Array.isArray(fields.folder) ? fields.folder[0] : fields.folder) || 'uploads';

        // --- Upload to Firebase ---
        const downloadURL = await uploadToFirebase(fileBuffer, originalName, folder);

        // --- Return success with URL ---
        res.status(201).json({
            message: 'File uploaded successfully',
            url: downloadURL,
            // filename: originalName, // Optional: return original name
        });

    } catch (error) {
        console.error("Upload Error:", error);
        // Provide user-friendly messages for common errors
        if (error.message && error.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
            res.status(500).json({ error: 'Server configuration error (Firebase not set up)' });
        } else if (error.message && error.message.includes('File buffer and original name')) {
            res.status(400).json({ error: 'Invalid file data received' });
        } else {
            res.status(500).json({ error: `Internal Server Error during upload: ${error.message}` });
        }
    }
});