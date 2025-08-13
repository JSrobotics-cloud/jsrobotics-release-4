import { connectToDatabase, Course } from '../../lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { id, showOnHomePage, showOnItsPage } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Course ID is required' });
    }

    try {
        await connectToDatabase();

        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            { showOnHomePage, showOnItsPage },
            { new: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.status(200).json(updatedCourse);
    } catch (error) {
        console.error(`Error updating course visibility:`, error);
        res.status(500).json({ error: 'Internal Server Error while updating visibility' });
    }
}
