// api/projects/index.js
import { connectToDatabase, Project } from '../../lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    try {
        await connectToDatabase();

        // Optional: Get query parameters for filtering (e.g., ?featured=true)
        const { featured } = req.query;
        let filter = {};

        // Example: Only get featured projects if query param is true
        if (featured === 'true') filter.featured = true; // Ensure your Project model has a 'featured' field

        // Populate 'author' field with username if needed
        const projects = await Project.find(filter).populate('author', 'username').select('-__v');

        res.status(200).json(projects);
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: 'Internal Server Error while fetching projects' });
    }
}