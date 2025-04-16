const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Increase header size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Updated CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));

// Serve favicon
app.use('/favicon.ico', express.static(path.join(__dirname, 'public', 'favicon.ico')));

// Update MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  family: 4 // Force IPv4
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// MongoDB connection events
const db = mongoose.connection;
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.once('open', () => {
  console.log('MongoDB connected successfully');
});

db.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

db.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Add before routes
app.use((req, res, next) => {
  const contentType = req.headers['content-type'];
  if (req.method !== 'GET' && contentType !== 'application/json') {
    return res.status(400).json({ 
      message: 'Content-Type must be application/json' 
    });
  }
  next();
});

// Import routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/taskRoutes'));

app.get('/', (req, res) => {
  res.send('Task Manager');
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Update error middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      message: 'Invalid JSON payload' 
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      message: 'Request entity too large' 
    });
  }

  if (err.code === 'HEADER_OVERFLOW') {
    return res.status(431).json({ 
      message: 'Request header is too large',
      error: err.message 
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
