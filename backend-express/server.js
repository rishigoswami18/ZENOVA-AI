require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/database');

// Connect to MongoDB Database
connectDB();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const resumeRoutes = require('./routes/resume');
const jobRoutes = require('./routes/jobs');
const interviewRoutes = require('./routes/interview');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.add_middleware = app.use(cors({
  origin: '*', // Allow all origins for the local mock deployment
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing Middleware Bindings
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/interview', interviewRoutes);

// Base Status Check
app.get('/', (req, res) => {
  res.status(200).json({
    status: "online",
    message: "ZENOVA AI Express Gateway active."
  });
});

app.head('/', (req, res) => {
  res.status(200).end();
});

// Start Server Listening
app.listen(PORT, () => {
  console.log(`Express gateway running on http://127.0.0.1:${PORT}`);
});
