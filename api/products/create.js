// api/products/create.js
import { connectToDatabase, Product } from '../../lib/db.js'; // Import the Product model
import { authenticateToken } from '../../lib/auth.js'; // Import authentication middleware

// Wrap the handler with authentication middleware
// Only authenticated users (admins) should be able to create products
export default authenticateToken(async function createProduct(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    try {
        await connectToDatabase();

        // Extract data from the request body (parsed JSON)
        const { name, price, description, image } = req.body;

        // Basic validation - Check for required fields
        if (!name || price === undefined || price === null || isNaN(parseFloat(price)) || !description) {
             return res.status(400).json({ error: 'Missing required fields: name, price (numeric), description' });
        }

        // Ensure price is a number
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice < 0) {
             return res.status(400).json({ error: 'Price must be a valid non-negative number' });
        }

        // Optional: Check for duplicate product names (if uniqueness is desired)
        // const existingProduct = await Product.findOne({ name: name.trim() });
        // if (existingProduct) {
        //     return res.status(409).json({ error: `A product with name '${name.trim()}' already exists.` });
        // }

        // --- Create product object ---
        const productData = {
            name: name.trim(),
            price: numericPrice,
            description: description.trim(),
            // Only include image URL if one was provided in the request body
            ...(image && { image: image.trim() }) // Sanitize URL string
            // Add other fields here if your Product schema includes them (e.g., category, stock)
        };

        // Create a new product instance using the Mongoose model
        const product = new Product(productData);

        // Save the new product to the database
        await product.save();

        // Return the created product data (excluding __v)
        const productObject = product.toObject({ versionKey: false });
        res.status(201).json(productObject);

    } catch (error) {
        console.error("Create Product Error:", error);
        // Provide more specific error messages based on error type if possible
        if (error.name === 'ValidationError') {
             // Mongoose validation error
             const messages = Object.values(error.errors).map(err => err.message);
             res.status(400).json({ error: `Validation Error: ${messages.join(', ')}` });
        } else if (error.message && error.message.includes('E11000')) {
             // MongoDB duplicate key error (if name or other field is unique)
             res.status(409).json({ error: 'A product with conflicting data already exists.' });
        } else {
             // General server error
             res.status(500).json({ error: `Internal Server Error during product creation: ${error.message}` });
        }
    }
});

// Optional: Configure API settings if needed (e.g., disable body parser if using formidable, but not needed for JSON)
// export const config = {
//   api: {
//     bodyParser: true, // Default is true, enable for JSON/text bodies
//   },
// };