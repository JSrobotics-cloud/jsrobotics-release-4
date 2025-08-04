// lib/auth.js
import jwt from 'jsonwebtoken';
import { User } from './db.js'; // Import User model

// Middleware to wrap API route handlers that require authentication
export const authenticateToken = (handler) => async (req, res) => {
    // Vercel specific: Get token from Authorization header (check both cases)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    try {
        // Verify token using the secret from environment variables
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error("JWT_SECRET is not set in environment variables!");
            throw new Error('Server configuration error');
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach user info to request object for use in the route handler
        // You might want to fetch the full user object from DB here if needed
        req.user = decoded; // Contains { userId, email, ... }

        // Proceed to the actual API route handler
        return await handler(req, res);
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        if (err.name === 'TokenExpiredError') {
            res.status(403).json({ error: 'Token expired' });
        } else if (err.name === 'JsonWebTokenError') {
            res.status(403).json({ error: 'Invalid token format' });
        } else {
            res.status(500).json({ error: 'Internal server error during authentication' });
        }
        return;
    }
};

// Helper function to generate a JWT (useful in login/register)
export function generateToken(user) {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not defined');
    }
    // Include only necessary information in the token
    return jwt.sign(
        { userId: user._id.toString(), email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' } // Adjust expiry as needed
    );
}