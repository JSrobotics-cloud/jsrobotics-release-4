// server.js (CORRECTED VERSION)
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Firebase Admin SDK Initialization
// Download service account key from Firebase Console:
// Project Settings > Service Accounts > Generate new private key
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY); // You'll download this

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com` // Default Firebase Storage bucket
});

const bucket = admin.storage().bucket();

// Multer configuration for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 5MB limit
    }
});

// User Schema
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
    completedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    points: { type: Number, default: 0 },
    badges: [{ type: String }]
});

const User = mongoose.model('User', userSchema);

// Course Schema
const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    tags: [String],
    sections: [{
        title: String,
        lessons: [{
            videoURL: String,
            text: String,
            quiz: [{
                question: String,
                options: [String],
                correctAnswer: Number
            }]
        }]
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const Course = mongoose.model('Course', courseSchema);

// Project Schema
const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    steps: [{
        text: String,
        imageURL: String
    }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: { type: Number, default: 0 },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    publishedAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

// Component Schema
const componentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    imageURL: String,
    description: String,
    datasheetURL: String,
    category: [{ type: String }],
    useCases: [String]
});

const Component = mongoose.model('Component', componentSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    kitItems: [{ type: mongoose.Schema.Types.ObjectId }],
    totalPrice: Number,
    status: { type: String, enum: ['pending', 'shipped', 'delivered'], default: 'pending' },
    shippingAddress: String,
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Helper function to upload files to Firebase Storage
const uploadToFirebase = async (file, folder) => {
    if (!file) return null;
    
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);
    
    const stream = fileUpload.createWriteStream({
        metadata: {
            contentType: file.mimetype
        }
    });
    
    return new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', async () => {
            // Make the file publicly readable
            await fileUpload.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            resolve(publicUrl);
        });
        stream.end(file.buffer);
    });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
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
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                points: user.points,
                badges: user.badges
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                points: user.points,
                badges: user.badges
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Course Routes
app.get('/api/courses', async (req, res) => {
    try {
        const { level, category } = req.query;
        let filter = {};
        
        if (level) filter.level = level;
        if (category) filter.tags = category;
        
        const courses = await Course.find(filter).populate('createdBy', 'username');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('createdBy', 'username');
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/courses', authenticateToken, upload.single('video'), async (req, res) => {
    try {
        const { title, description, level, tags, sections } = req.body;
        
        // Upload video if provided
        let videoURL = null;
        if (req.file) {
            videoURL = await uploadToFirebase(req.file, 'videos');
        }
        
        const course = new Course({
            title,
            description,
            level,
            tags: tags ? JSON.parse(tags) : [],
            sections: sections ? JSON.parse(sections) : [],
            createdBy: req.user.userId,
            videoURL
        });
        
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Project Routes
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find().populate('author', 'username');
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/projects', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { title, description, steps } = req.body;
        
        // Upload image if provided
        let imageURL = null;
        if (req.file) {
            imageURL = await uploadToFirebase(req.file, 'projects');
        }
        
        const project = new Project({
            title,
            description,
            steps: steps ? JSON.parse(steps) : [],
            author: req.user.userId,
            imageURL
        });
        
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Component Routes
app.get('/api/components', async (req, res) => {
    try {
        const { category } = req.query;
        let filter = {};
        
        if (category) filter.category = category;
        
        const components = await Component.find(filter);
        res.json(components);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/components', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { name, description, datasheetURL, category, useCases } = req.body;
        
        // Upload image if provided
        let imageURL = null;
        if (req.file) {
            imageURL = await uploadToFirebase(req.file, 'components');
        }
        
        const component = new Component({
            name,
            description,
            datasheetURL,
            category: category ? JSON.parse(category) : [],
            useCases: useCases ? JSON.parse(useCases) : [],
            imageURL
        });
        
        await component.save();
        res.status(201).json(component);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Order Routes
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { kitItems, totalPrice, shippingAddress } = req.body;
        
        const order = new Order({
            userId: req.user.userId,
            kitItems: kitItems ? JSON.parse(kitItems) : [],
            totalPrice,
            shippingAddress
        });
        
        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.userId });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// User Profile Routes
app.get('/api/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { bio, languagePreference } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { 
                'profile.bio': bio,
                languagePreference
            },
            { new: true }
        ).select('-passwordHash');
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});