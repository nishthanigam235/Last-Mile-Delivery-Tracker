const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Standard Middlewares
app.use(cors({
  origin: '*', // Allow all client links for development
  credentials: true,
}));
app.use(express.json());

// Mount API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/zones', require('./routes/zones'));
app.use('/api/rate-cards', require('./routes/ratecards'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/agents', require('./routes/agents'));

// Root Endpoint for healthcheck
app.get('/', (req, res) => {
  res.json({ message: 'Last-Mile Delivery Tracker API is running' });
});

// Centralized Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
