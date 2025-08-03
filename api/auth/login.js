// api/auth/login.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- Mongoose Models (Same as in register.js) ---
// It's often better to put shared models in a separate file and import,
// but for simplicity and self-containment in Vercel functions:

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

let User;

async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) {
        if (User) return;
        User = mongoose.models.User || mongoose.model('User', userSchema);
        return;
    }

    const MONGO_URI = process.env.MONGODB_URI;
    if (!MONGO_URI) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    User = mongoose.models.User || mongoose.model('User', userSchema);
}
// --- End of Mongoose Models ---

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Connect to the database
        await connectToDatabase();

        // Find user by email
        // .select('+passwordHash') is not needed if passwordHash isn't excluded by default in the schema
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' }); // Generic message for security
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' }); // Generic message for security
        }

        // Generate JWT token
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error("JWT_SECRET is not set in environment variables!");
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

        res.status(200).json({
            message: 'Login successful',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Internal Server Error during login' });
    }
}