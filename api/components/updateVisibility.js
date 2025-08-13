import { connectToDatabase, Components } from '../../lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { id, showOnHomePage, showOnItsPage } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'ID is required' });
    }

    try {
        await connectToDatabase();

        const updatedItem = await Components.findByIdAndUpdate(
            id,
            { showOnHomePage, showOnItsPage },
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.status(200).json(updatedItem);
    } catch (error) {
        console.error(`Error updating visibility:`, error);
        res.status(500).json({ error: 'Internal Server Error while updating visibility' });
    }
}
