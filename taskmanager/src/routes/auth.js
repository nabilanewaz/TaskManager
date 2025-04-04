const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const JWT_SECRET = "secretkey";

// User Registration
router.post('/register', async(req, res) => {
    try{
        const { name, email, password, role } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user 
        user = new User({
            name,
            email,
            password: hashedPassword,
            role
        });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    }
    catch (err) {
        res.status(500).jason({ error: err.message });

    }
});

// User Login
router.post('/login', async(req, res) => {
    try{
        const { email, password } = req.body;

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
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;