// api/products/index.js

import { connectToDatabase, Product } from '../../lib/db.js'; // Corrected assuming model is named Product

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    try {
        await connectToDatabase();

        // Optional: Get query parameters for filtering (e.g., ?category=sensors)
        // Note: Products typically don't have a 'category' in the provided snippets,
        // but you might add one later. Placeholder for potential future use.
        const { category } = req.query;
        let filter = {};

        // Example filter (uncomment and adjust if you add categories/tags to products)
        // if (category) filter.category = category;

        // Fetch products from the database
        // Select fields, excluding the MongoDB version key (__v)
        const products = await Product.find(filter).select('-__v');

        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        // Provide a user-friendly message, but log the full error server-side
        res.status(500).json({ error: 'Internal Server Error while fetching products' });
    }
}