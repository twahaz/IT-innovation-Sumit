require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { pool, initDb } = require('./db');
const registrationRoutes = require('./routes/registrations');
const eventRoutes = require('./routes/events');
const adminAuthRoutes = require('./routes/adminAuth');
const adminRegistrationRoutes = require('./routes/adminRegistrations');
const adminEventRoutes = require('./routes/adminEvents');
const adminScheduleRoutes = require('./routes/adminSchedule');
const adminProfileRoutes = require('./routes/adminProfile');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directory exists
const profileUploadDir = path.join(__dirname, 'uploads', 'profile');
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://it-innovation-sumit.vercel.app',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Static File Serving for Uploaded Assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public Routes
app.use('/api/registrations', registrationRoutes);
app.use('/api/events', eventRoutes);

// Admin Routes
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', adminRegistrationRoutes);
app.use('/api/admin', adminEventRoutes);
app.use('/api/admin', adminScheduleRoutes);
app.use('/api/admin', adminProfileRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'IT Innovation Summit API is running',
  });
});

// Start Server
const server = app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(` IT Innovation Summit 2026 Backend API`);
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(` Registrations: http://localhost:${PORT}/api/registrations`);
  console.log(` Admin Portal: http://localhost:${PORT}/api/admin`);
  console.log(`=========================================`);

  await initDb();
});

module.exports = { app, pool, server };
