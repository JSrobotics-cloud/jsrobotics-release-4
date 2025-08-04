// api/courses/[id].js
import { connectToDatabase, Course } from '../../lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { id } = req.query; // Vercel provides dynamic route params in req.query

    if (!id) {
        return res.status(400).json({ error: 'Course ID is required' });
    }

    try {
        await connectToDatabase();

        // Find course by its unique courseId slug or MongoDB _id
        // Adjust query based on how you want to fetch (by slug or _id)
        // Assuming 'id' in the URL is the 'courseId' slug
        const course = await Course.findOne({ courseId: id }).select('-__v');

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.status(200).json(course);
    } catch (error) {
        console.error(`Error fetching course with ID ${id}:`, error);
        // Differentiate between server errors and not found?
        res.status(500).json({ error: 'Internal Server Error while fetching course' });
    }
}