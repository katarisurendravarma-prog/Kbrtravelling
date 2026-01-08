const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('./models/User');
const Booking = require('./models/Booking');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your_jwt_secret_key_here'; // In production, use environment variables

// Middleware (Relaxed CORS for local development)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Private-Network', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/kbr_travel').then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Email Configuration (Nodemailer) ---
// IMPORTANT: You need to provide your own email and password (or App Password) here.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kbrtravellers@gmail.com', // Your Gmail address
        pass: 'vhtnbrypqtpwbzah'    // Your Gmail App Password (not your regular password)
    }
});

// --- API Routes ---

// 1. User Registration
app.post('/api/register', async (req, res) => {
    console.log('📝 Received Registration Request:', req.body.email);
    try {
        const { name, email, phone, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({ name, email, phone, password });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('❌ Registration Error:', err);
        res.status(500).json({ message: 'Server error: ' + (err.message || 'Unknown error') });
    }
});

// 2. User Login
app.post('/api/login', async (req, res) => {
    console.log('👤 Received Login Request:', req.body.email);
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error('❌ Login Error:', err);
        res.status(500).json({ message: 'Server error: ' + (err.message || 'Unknown error') });
    }
});

// 3. Create Booking
app.post('/api/bookings', async (req, res) => {
    console.log('💰 Received Booking Request for:', req.body.place);
    try {
        const bookingData = req.body;
        const newBooking = new Booking(bookingData);
        await newBooking.save();
        res.status(201).json({ message: 'Booking successful', booking: newBooking });
    } catch (err) {
        console.error('❌ Booking Error:', err);
        res.status(500).json({ message: 'Error creating booking: ' + err.message });
    }
});

// 4. Contact/Doubts Email Endpoint
app.post('/api/contact', async (req, res) => {
    const { email, message } = req.body;
    console.log('✉️ Received Doubt from:', email);

    const mailOptions = {
        from: email,
        to: 'kbrtravellers@gmail.com',
        subject: `New Doubt from KBR Travel: ${email}`,
        text: `You have received a new question from ${email}:\n\n${message}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully');
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('❌ Email Error:', error);
        res.status(500).json({ message: 'Error sending email: ' + error.message });
    }
});

// 5. Root Route for Connectivity Test
app.get('/', (req, res) => {
    res.json({ message: '🚀 KBR Travel Backend is Running!' });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
