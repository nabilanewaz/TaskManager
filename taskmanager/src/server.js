const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://nabilanewaz:<12345>@cluster0.6qswc31.mongodb.net/')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

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
