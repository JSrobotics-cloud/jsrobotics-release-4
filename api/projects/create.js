// api/projects/create.js
import { connectToDatabase, Project } from '../../lib/db.js';
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

export default authenticateToken(async function createProject(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    try {
        await connectToDatabase();

        const form = formidable({ multiples: false }); // Expect single file for 'image'

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

        const title = getData(fields.title);
        const description = getData(fields.description);
        // Assuming steps is sent as a JSON string
        let steps = [];
        try {
            const stepsStr = getData(fields.steps);
            if (stepsStr) {
                steps = JSON.parse(stepsStr);
            }
        } catch (e) {
            console.warn("Failed to parse steps JSON:", e.message);
        }

        if (!title || !description) {
            return res.status(400).json({ error: 'Missing required fields: title, description' });
        }

        // --- Handle file upload (project image) ---
        let imageURL = null;
        const uploadedImage = files.image; // Match form field name
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
                const originalName = uploadedImage.originalFilename || 'project_image.jpg';
                imageURL = await uploadToFirebase(fileBuffer, originalName, 'project_images');
            } catch (uploadError) {
                console.error("Project image upload error:", uploadError);
                return res.status(500).json({ error: `Failed to upload project image: ${uploadError.message}` });
            }
        }

        // --- Create project object ---
        const projectData = {
            title,
            description,
            steps,
            author: req.user.userId, // From auth middleware
            ...(imageURL && { imageURL })
        };

        const project = new Project(projectData);
        await project.save();

        // Populate author for response
        await project.populate('author', 'username');
        const projectObject = project.toObject({ versionKey: false });
        res.status(201).json(projectObject);

    } catch (error) {
        console.error("Create Project Error:", error);
        res.status(500).json({ error: `Internal Server Error during project creation: ${error.message}` });
    }
});