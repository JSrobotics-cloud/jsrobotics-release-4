// api/auth/googleSign.js

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['student', 'content_creator', 'admin'], default: 'student' },
  points: { type: Number, default: 0 },
  badges: [{ type: String }]
});

let User; 

async function connectToDatabase() {
  if (mongoose.connection.readyState < 1) {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error('Missing MONGODB_URI');
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  }
  if (!User) {
    User = mongoose.models.User || mongoose.model('User', userSchema);
  }
}

async function verifyToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  return ticket.getPayload();
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { tokenId } = req.body;
  if (!tokenId) {
    return res.status(400).json({ error: 'Missing tokenId' });
  }

  try {
    await connectToDatabase();
    const payload = await verifyToken(tokenId);
    const { email, name } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ username: name, email, badges: ['Google Auth'] });
    }

    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Google login successful',
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        points: user.points,
        badges: user.badges
      }
    });

  } catch (err) {
    console.error('Google sign-in error:', err);
    return res.status(500).json({ error: 'Server error during Google login' });
  }
};
