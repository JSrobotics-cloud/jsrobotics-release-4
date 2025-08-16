// lib/db.js
import mongoose from 'mongoose';

// Use a global variable to prevent multiple Mongoose connections
// This is a common pattern for serverless functions to reuse connections.
let cachedDbConnection = null;
let modelsInitialized = false;

// Helper to initialize models if not already done
function initializeModels() {
    if (modelsInitialized) return;

    // --- Mongoose Models ---
    // Define them here or import definitions if they get large

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

    // Course Schema
    const courseSchema = new mongoose.Schema({
        courseId: { type: String, required: true, unique: true }, // For URL slug
        title: { type: String, required: true },
        description: { type: String, required: true },
        level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
        duration: String, // e.g., "4 weeks"
        image: String, // URL from Firebase
        sections: [{
            title: String,
            lessons: [{
                title: String,
                content: String,
                videoUrl: String // URL from Firebase
            }]
        }],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        showOnHomePage: { type: Boolean, default: false },
        showOnItsPage: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    });

    // Project Schema
    const projectSchema = new mongoose.Schema({
        title: { type: String, required: true },
        description: { type: String, required: true },
        steps: [{
            text: String,
            imageURL: String // URL from Firebase
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

    // Component Schema
    const componentSchema = new mongoose.Schema({
        componentId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        image: String, // URL from Firebase
        description: String,
        category: { type: String, enum: ['sensor', 'actuator', 'microcontroller', 'sbc'] },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        showOnHomePage: { type: Boolean, default: false },
        showOnItsPage: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    });

    // Order Schema (if needed)
    const orderSchema = new mongoose.Schema({
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        // kitItems: [{ type: mongoose.Schema.Types.ObjectId }], // Adjust based on your needs
        totalPrice: Number,
        status: { type: String, enum: ['pending', 'shipped', 'delivered'], default: 'pending' },
        shippingAddress: String,
        createdAt: { type: Date, default: Date.now }
    });

    const productSchema = new mongoose.Schema({
        productId: { type: String, required: true, unique: true },
        name: String,
        price: Number,
        description: String ,
        image: String, // URL from Firebase
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        showOnHomePage: { type: Boolean, default: false },
        showOnItsPage: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    });

    // Compile models if not already compiled (important for serverless)
    global.User = global.User || mongoose.model('User', userSchema);
    global.Course = global.Course || mongoose.model('Course', courseSchema);
    global.Project = global.Project || mongoose.model('Project', projectSchema);
    global.Component = global.Component || mongoose.model('Component', componentSchema);
    global.Order = global.Order || mongoose.model('Order', orderSchema);
    global.Product = global.Product || mongoose.model('Product', productSchema);

    modelsInitialized = true;
    console.log("Mongoose models initialized");
}


export async function connectToDatabase() {
    // Only log when we *actually* connect, not when reusing
    if (cachedDbConnection && mongoose.connection.readyState >= 1) {
        initializeModels();
        return mongoose.connection;
    }

    const MONGO_URI = process.env.MONGODB_URI;
    if (!MONGO_URI) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log("Connecting to MongoDB...");
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        cachedDbConnection = mongoose.connection;
        console.log("Connected to MongoDB successfully");
        initializeModels();
        return cachedDbConnection;
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        throw err;
    }
}


// Export models for use in API routes
// Ensure they are initialized before export
initializeModels();
export const User = global.User;
export const Course = global.Course;
export const Project = global.Project;
export const Component = global.Component;
export const Order = global.Order;
export const Product = global.Product;