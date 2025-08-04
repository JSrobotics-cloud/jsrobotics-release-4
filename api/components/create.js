// api/components/create.js
import { connectToDatabase, Component } from '../../lib/db.js';
import { initializeFirebase, uploadToFirebase } from '../../lib/firebase.js';
import { authenticateToken } from '../../lib/auth.js';
import formidable from 'formidable';
import fs from 'fs/promises';

initializeFirebase();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default authenticateToken(async function createComponent(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    try {
        await connectToDatabase();

        const form = formidable({ multiples: false });

        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.error("Formidable parsing error:", err);
                    reject(new Error(`Error parsing form data: ${err.message}`));
                } else {
                    resolve({ fields, files });
                }
            });
        });

        const getData = (fieldObj) => {
            if (!fieldObj) return undefined;
            return Array.isArray(fieldObj) ? fieldObj[0] : fieldObj;
        };

        const name = getData(fields.name);
        const description = getData(fields.description);
        const category = getData(fields.category);

        if (!name) {
            return res.status(400).json({ error: 'Missing required field: name' });
        }

        // --- Handle file upload (component image) ---
        let imageURL = null;
        const uploadedImage = files.image;
        if (uploadedImage) {
            try {
                let fileBuffer;
                if (uploadedImage.filepath) {
                    fileBuffer = await fs.readFile(uploadedImage.filepath);
                } else if (uploadedImage.buffer) {
                    fileBuffer = uploadedImage.buffer;
                } else {
                    throw new Error("Uploaded file data not found");
                }
                const originalName = uploadedImage.originalFilename || 'component_image.jpg';
                imageURL = await uploadToFirebase(fileBuffer, originalName, 'component_images');
            } catch (uploadError) {
                console.error("Component image upload error:", uploadError);
                return res.status(500).json({ error: `Failed to upload component image: ${uploadError.message}` });
            }
        }

        // --- Create component object ---
        const componentData = {
            name,
            description,
            category,
            ...(imageURL && { image: imageURL })
        };

        const component = new Component(componentData);
        await component.save();

        const componentObject = component.toObject({ versionKey: false });
        res.status(201).json(componentObject);

    } catch (error) {
        console.error("Create Component Error:", error);
        res.status(500).json({ error: `Internal Server Error during component creation: ${error.message}` });
    }
});