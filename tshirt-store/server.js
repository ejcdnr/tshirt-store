// server.js - Main backend server file

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer for file uploads (product images)
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: Images Only! (jpeg, jpg, png, webp)'));
    }
});

// Serve static files
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tshirt-store', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Define Schemas and Models
// User Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Product Schema
const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['men', 'women', 'unisex']
    },
    sizes: [{
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    }],
    colors: [{
        type: String
    }],
    images: [{
        type: String,
        required: true
    }],
    inStock: {
        type: Boolean,
        default: true
    },
    stockQuantity: {
        type: Number,
        default: 100
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Order Schema
const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow guest checkout
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        size: {
            type: String,
            required: true
        },
        color: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        phone: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['credit_card', 'paypal', 'stripe']
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ['processing', 'shipped', 'delivered', 'cancelled'],
        default: 'processing'
    },
    trackingNumber: {
        type: String
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
});

// Create models from schemas
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);

// Middleware for JWT authentication
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'Authentication invalid' });
        }
        
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

// Admin authorization middleware
const adminAuth = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
};

// API Routes
// User Routes
// Register new user
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user already exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });
        
        await user.save();
        
        // Create JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );
        
        res.status(201).json({
            id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login user
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Create JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );
        
        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user profile
app.get('/api/users/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Product Routes
// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const { category, featured, search, sortBy } = req.query;
        let query = {};
        
        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }
        
        // Filter featured products
        if (featured === 'true') {
            query.featured = true;
        }
        
        // Search by name
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        // Sort options
        let sort = {};
        if (sortBy === 'price-asc') {
            sort.price = 1;
        } else if (sortBy === 'price-desc') {
            sort.price = -1;
        } else if (sortBy === 'newest') {
            sort.createdAt = -1;
        } else {
            sort.createdAt = -1; // Default sort
        }
        
        const products = await Product.find(query).sort(sort);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create new product (admin only)
app.post('/api/products', auth, adminAuth, upload.array('images', 5), async (req, res) => {
    try {
        const { name, description, price, category, sizes, colors, stockQuantity, featured } = req.body;
        
        // Process uploaded images
        const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
        
        const product = new Product({
            name,
            description,
            price,
            category,
            sizes: sizes.split(','),
            colors: colors.split(','),
            images: imagePaths,
            stockQuantity,
            featured: featured === 'true'
        });
        
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update product (admin only)
app.put('/api/products/:id', auth, adminAuth, upload.array('images', 5), async (req, res) => {
    try {
        const { name, description, price, category, sizes, colors, stockQuantity, featured, inStock } = req.body;
        
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Update fields
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.category = category || product.category;
        product.sizes = sizes ? sizes.split(',') : product.sizes;
        product.colors = colors ? colors.split(',') : product.colors;
        product.stockQuantity = stockQuantity || product.stockQuantity;
        product.featured = featured === 'true' ? true : featured === 'false' ? false : product.featured;
        product.inStock = inStock === 'true' ? true : inStock === 'false' ? false : product.inStock;
        
        // Process uploaded images if any
        if (req.files && req.files.length > 0) {
            const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
            product.images = [...product.images, ...imagePaths];
        }
        
        await product.save();
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete product (admin only)
app.delete('/api/products/:id', auth, adminAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        await product.remove();
        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Order Routes
// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const { 
            items, 
            totalAmount, 
            shippingAddress, 
            paymentMethod,
            userId
        } = req.body;
        
        // Check if user exists if userId is provided
        if (userId) {
            const userExists = await User.findById(userId);
            if (!userExists) {
                return res.status(400).json({ message: 'User not found' });
            }
        }
        
        // Verify products and calculate total
        let calculatedTotal = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ message: `Product ${item.product} not found` });
            }
            
            if (!product.inStock || product.stockQuantity < item.quantity) {
                return res.status(400).json({ message: `Product ${product.name} is out of stock or insufficient quantity` });
            }
            
            calculatedTotal += product.price * item.quantity;
            
            // Update product stock
            product.stockQuantity -= item.quantity;
            if (product.stockQuantity === 0) {
                product.inStock = false;
            }
            await product.save();
        }
        
        // Verify total amount
        if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
            return res.status(400).json({ message: 'Total amount does not match calculated total' });
        }
        
        // Create order
        const order = new Order({
            user: userId || null,
            items,
            totalAmount,
            shippingAddress,
            paymentMethod
        });
        
        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all orders (admin only)
app.get('/api/orders', auth, adminAuth, async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'username email')
            .populate('items.product', 'name price images')
            .sort({ orderDate: -1 });
        
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user orders
app.get('/api/orders/myorders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product', 'name price images')
            .sort({ orderDate: -1 });
        
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get order by ID
app.get('/api/orders/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'username email')
            .populate('items.product', 'name price images');
        
        // Check if order exists
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Check if user is authorized to view this order
        if (!req.user.isAdmin && order.user && order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update order status (admin only)
app.put('/api/orders/:id', auth, adminAuth, async (req, res) => {
    try {
        const { orderStatus, paymentStatus, trackingNumber } = req.body;
        
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Update fields
        if (orderStatus) order.orderStatus = orderStatus;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
