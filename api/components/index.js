// api/components/index.js
import { connectToDatabase, Component } from '../../lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    try {
        await connectToDatabase();

        // Optional: Get query parameters for filtering (e.g., ?category=sensor)
        const { category } = req.query;
        let filter = {};

        if (category) filter.category = category;

        const components = await Component.find(filter).select('-__v');

        res.status(200).json(components);
    } catch (error) {
        console.error("Error fetching components:", error);
        res.status(500).json({ error: 'Internal Server Error while fetching components' });
    }
}