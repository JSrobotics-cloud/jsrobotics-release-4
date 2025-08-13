import { connectToDatabase, Course } from '../../lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    try {
        await connectToDatabase();

        const { level, showOnHomePage, showOnItsPage } = req.query;
        let filter = {};

        if (level) filter.level = level;

        if (showOnHomePage === 'true') filter.showOnHomePage = true;
        if (showOnItsPage === 'true') filter.showOnItsPage = true;

        const courses = await Course.find(filter).select('-__v');
        res.status(200).json(courses);

    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ error: 'Internal Server Error while fetching courses' });
    }
}
