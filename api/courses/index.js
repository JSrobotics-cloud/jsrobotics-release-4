// api/courses/index.js
import { connectToDatabase, Course } from '../../lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
 
    try {
        await connectToDatabase();

        // Optional: Get query parameters for filtering (e.g., ?level=beginner)
        const { level, featured } = req.query;
        let filter = {};

        if (level) filter.level = level;
        // Example: Only get featured courses if query param is true
        if (featured === 'true') filter.featured = true;

        // Populate 'createdBy' field with username if needed
        const courses = await Course.find(filter).select('-__v'); // Exclude version key

        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ error: 'Internal Server Error while fetching courses' });
    }
}