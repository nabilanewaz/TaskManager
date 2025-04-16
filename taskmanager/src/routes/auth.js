const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const JWT_SECRET = "4eb2e0812ce8ece5ce36681d78ea793452803c0a46044082f24d62e50b6c5b2b80f0a731b163656490b5ae7915259a5582316f365f181a8df9b22e501be986de";
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// User Registration
router.post('/register', async(req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ 
                message: 'Please provide all required fields' 
            });
        }

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ 
                message: 'User already exists with this email' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user 
        user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'user'
        });

        await user.save();

        // Send response before attempting email (since email is optional)
        res.status(201).json({ 
            message: 'Registration successful! You can now login.',
            userId: user._id 
        });

        // Attempt to send verification email
        try {
            const verificationToken = crypto.randomBytes(32).toString('hex');
            user.verificationToken = verificationToken;
            await user.save();

            const verificationLink = `http://localhost:3000/verify/${verificationToken}`;
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Verify your email',
                html: `Click <a href="${verificationLink}">here</a> to verify your email.`
            });
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't throw error since registration was successful
        }
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ 
            message: 'Failed to register user',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// User Login
router.post('/login', async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET || JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

router.get('/verify/:token', async(req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid verification token' });
        }

        user.verified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;