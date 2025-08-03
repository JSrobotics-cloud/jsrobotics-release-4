// api/auth/register.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// IMPORTANT: You'll likely need to adjust these imports
// or define the schemas directly here for Vercel functions.
// Vercel functions should be self-contained.

// --- Mongoose Models (Define them here or import appropriately) ---
// For Vercel, it's often easier to define them directly to avoid import issues.
// Make sure MONGO_URI is set in your Vercel project's environment variables.

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'content_creator', 'admin'], default: 'student' },
    profile: {
        bio: String,
        avatarURL: String
    },
    languagePreference: { type: String, default: 'en' },
    completedCourses: [{ type: mongoose.Schema.Types.ObjectId }], // Ref removed for simplicity
    points: { type: Number, default: 0 },
    badges: [{ type: String }]
});

// Use a global variable to prevent multiple Mongoose connections
// This is a common pattern for serverless functions to reuse connections.
let User;

// Helper function to connect to MongoDB
async function connectToDatabase() {
    // Check if we're already connected or connecting
    if (mongoose.connection.readyState >= 1) {
        // If models are already compiled, return
        if (User) return;
        // If connection exists but models not compiled, compile them
        User = mongoose.models.User || mongoose.model('User', userSchema);
        return;
    }

    // If not connected, connect
    const MONGO_URI = process.env.MONGODB_URI;
    if (!MONGO_URI) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    // Compile the model if not already compiled
    User = mongoose.models.User || mongoose.model('User', userSchema);
}

res.setHeader("Access-Control-Allow-Origin", "*"); // or your frontend URL
res.setHeader("Access-Control-Allow-Headers", "Content-Type");


export default async function handler(req) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    try {
        // Connect to the database
        await connectToDatabase();

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create new user
        const user = new User({
            username,
            email,
            passwordHash
        });

        await user.save();

        // Generate JWT token
        // Make sure JWT_SECRET is set in your Vercel project's environment variables
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error("JWT_SECRET is not set in environment variables!");
            // Consider if you want to proceed without a strong secret in development
            // but it's crucial for production.
            // For now, we'll throw an error.
            throw new Error('JWT_SECRET environment variable is not defined');
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return successful response (excluding password hash)
        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            points: user.points,
            badges: user.badges || []
        };

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error("Registration Error:", error);
        // Differentiate between user errors and server errors if needed
        if (error.name === 'ValidationError') {
             res.status(400).json({ error: 'Invalid user data provided' });
        } else if (error.code === 11000) { // Duplicate key error
             res.status(400).json({ error: 'User already exists' });
        } else {
            res.status(500).json({ error: 'Internal Server Error during registration' });
        }
    }
}