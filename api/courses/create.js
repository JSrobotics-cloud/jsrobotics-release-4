// api/courses/create.js
import { connectToDatabase, Course } from '../../lib/db.js';
import { initializeFirebase, uploadToFirebase } from '../../lib/firebase.js';
import { authenticateToken } from '../../lib/auth.js';
import formidable from 'formidable';
import fs from 'fs/promises'; // To read the uploaded file buffer

// Initialize shared services (safe to call multiple times)
initializeFirebase();

// Configure formidable for parsing multipart data in serverless
export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

// Wrap the handler with authentication middleware
const createCourse = authenticateToken(async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    try {
        await connectToDatabase();

        // --- Parse multipart form data using formidable ---
        const form = formidable({
            multiples: false, // Expect single file for 'image'
            // maxFileSize: 50 * 1024 * 1024, // 50MB limit (adjust as needed)
        });

        // Promisify the form parsing
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

        // --- Extract data from parsed fields ---
        // Vercel/Express might parse fields as arrays, get the first value
        const getData = (fieldObj) => {
            if (!fieldObj) return undefined;
            return Array.isArray(fieldObj) ? fieldObj[0] : fieldObj;
        };

        const courseId = getData(fields.courseId);
        const title = getData(fields.title);
        const description = getData(fields.description);
        const level = getData(fields.level);
        const duration = getData(fields.duration);
        // Assuming sections is sent as a JSON string
        let sections = [];
        try {
            const sectionsStr = getData(fields.sections);
            if (sectionsStr) {
                sections = JSON.parse(sectionsStr);
            }
        } catch (e) {
            console.warn("Failed to parse sections JSON, defaulting to empty array:", e.message);
        }

        if (!courseId || !title || !description || !level) {
            return res.status(400).json({ error: 'Missing required fields: courseId, title, description, level' });
        }

        // --- Check for duplicate courseId ---
        const existingCourse = await Course.findOne({ courseId });
        if (existingCourse) {
            return res.status(409).json({ error: `A course with ID '${courseId}' already exists.` });
        }

        // --- Handle file upload (course card image) ---
        let imageURL = null;
        const uploadedImage = files.image; // Match the field name used in admin.js form
        if (uploadedImage) {
            try {
                // formidable provides a temp file path, read its buffer
                // Note: formidable v2+ might provide a buffer directly, check structure
                // This example assumes it provides a file path
                let fileBuffer;
                if (uploadedImage.filepath) {
                    // If it's a temp file path
                    fileBuffer = await fs.readFile(uploadedImage.filepath);
                } else if (uploadedImage.buffer) {
                    // If it's already a buffer
                    fileBuffer = uploadedImage.buffer;
                } else {
                    throw new Error("Uploaded file data not found (no filepath or buffer)");
                }

                const originalName = uploadedImage.originalFilename || 'course_image.jpg';
                imageURL = await uploadToFirebase(fileBuffer, originalName, 'course_images');
            } catch (uploadError) {
                console.error("Course image upload error:", uploadError);
                // Depending on your requirements, you might fail the whole request
                // or proceed without the image. Here, we'll fail.
                return res.status(500).json({ error: `Failed to upload course image: ${uploadError.message}` });
            }
        }

        // --- Create course object ---
        const courseData = {
            courseId,
            title,
            description,
            level,
            duration,
            sections,
            createdBy: req.user.userId, // From auth middleware
            featured: false, // New courses are not featured by default
            ...(imageURL && { image: imageURL }) // Only add image URL if uploaded
        };

        const course = new Course(courseData);
        await course.save();

        // Return the created course (excluding __v)
        const courseObject = course.toObject({ versionKey: false });
        res.status(201).json(courseObject);

    } catch (error) {
        console.error("Create Course Error:", error);
        // Provide more specific error messages based on error type if possible
        if (error.message && error.message.includes('E11000')) { // MongoDB duplicate key error
             res.status(409).json({ error: 'A course with conflicting data already exists.' });
        } else {
             res.status(500).json({ error: `Internal Server Error during course creation: ${error.message}` });
        }
    }
});

export default createCourse;