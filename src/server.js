const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Task Manager API' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
