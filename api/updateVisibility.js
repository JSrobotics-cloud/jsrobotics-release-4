// api/updateVisibility.js
import { connectToDatabase, Course, Product, Component } from '../../lib/db.js';

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { id, type, showOnHomePage, showOnItsPage } = req.body;

    if (!id || !type) {
        return res.status(400).json({ error: 'ID and type are required' });
    }

    try {
        
        await connectToDatabase();

        let Model;
        switch (type) {
            case 'courses': Model = Course; break;
            case 'products': Model = Product; break;
            case 'components': Model = Component; break;
            default: return res.status(400).json({ error: 'Invalid type' });
        }

        const updatedItem = await Model.findByIdAndUpdate(
            id,
            { showOnHomePage, showOnItsPage },
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ error: `${type} item not found` });
        }

        res.status(200).json(updatedItem);
    } catch (error) {
        console.error(`Error updating visibility:`, error);
        res.status(500).json({ error: 'Internal Server Error while updating visibility' });
    }
}
