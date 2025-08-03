// api/auth/login.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mongoose Schema & Model
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
    completedCourses: [{ type: mongoose.Schema.Types.ObjectId }],
    points: { type: Number, default: 0 },
    badges: [{ type: String }]
});

let User;

async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) {
        if (!User) {
            User = mongoose.models.User || mongoose.model('User', userSchema);
        }
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

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        await connectToDatabase();

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

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

        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            points: user.points,
            badges: user.badges || []
        };

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: userResponse
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
