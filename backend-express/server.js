require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/database');

// Connect to MongoDB Database
// Connect to MongoDB Database (Non-blocking attempt to prevent startup crash)
connectDB().catch(err => {
  console.error("CRITICAL: Initial database connection failed but server is starting anyway.");
  console.error(err.message);
});

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const resumeRoutes = require('./routes/resume');
const jobRoutes = require('./routes/jobs');
const interviewRoutes = require('./routes/interview');

const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Setup correlation ID middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
});

// Configure CORS with production safety checks
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Access blocked by CORS security policy'));
    }
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id']
}));

// Apply Rate Limiters to secure from denial-of-service / brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: { error: "Too many requests to authentication endpoint. Please retry after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: { error: "Rate limit exceeded. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing Middleware Bindings
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/resume', apiLimiter, resumeRoutes);
app.use('/api/jobs', apiLimiter, jobRoutes);
app.use('/api/interview', apiLimiter, interviewRoutes);

// Base Status & Health Checks
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1; // 1 = connected

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "online" : "unhealthy",
    database: isHealthy ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: "online",
    message: "ZENOVA AI Express Gateway active.",
    correlationId: req.correlationId
  });
});

app.head('/', (req, res) => {
  res.status(200).end();
});

// Start Server Listening
app.listen(PORT, () => {
  console.log(`Express gateway running on http://127.0.0.1:${PORT}`);
});
