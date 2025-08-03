// File: /api/auth/googleSign.js

import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  return ticket.getPayload();
}


// === User Schema ===
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // optional for Google
  role: { type: String, enum: ['student', 'content_creator', 'admin'], default: 'student' },
  points: { type: Number, default: 0 },
  badges: [{ type: String }]
});

let User;

async function connectToDatabase() {
  if (mongoose.connection.readyState < 1) {
    const MONGO_URI = process.env.MONGODB_URI;
    if (!MONGO_URI) throw new Error('MONGODB_URI is not set');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }
  if (!User) {
    User = mongoose.models.User || mongoose.model('User', userSchema);
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { tokenId } = req.body;
  if (!tokenId) {
    return res.status(400).json({ error: 'tokenId is required' });
  }

  try {
    await connectToDatabase();

    const client = new google.auth.OAuth2();
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username: name,
        email,
        profile: { avatarURL: picture },
        badges: ['Google Auth']
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        badges: user.badges
      }
    });

  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ error: 'Internal Server Error during Google login' });
  }
}
