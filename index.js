import express from 'express';
import path from 'path';
import userRoutes from './rutas';
import webPush from 'web-push';
import https from 'https';
import fs from 'fs';
import compression from 'compression'; // Add GZIP compression
import rateLimit from 'express-rate-limit'; // Add rate limiting
import helmet from 'helmet'; // Add security headers

// Use environment variables for sensitive data
const port = process.env.PORT || 443; // Standard HTTPS port
const app = express();

// Production security configurations
app.set('trust proxy', 1); // Trust first proxy
app.disable('x-powered-by'); // Hide Express
app.use(helmet()); // Secure HTTP headers

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// VAPID keys should come from environment variables
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

webPush.setVapidDetails(
  `mailto:${process.env.CONTACT_EMAIL}`,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Middleware
app.use(compression()); // GZIP compression
app.use(limiter); // Rate limiting
app.use(express.json({ limit: '10kb' })); // Body size limiting
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'publicos'), {
  maxAge: '1d' // Cache static assets
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vistas'));

// Routes
app.use('/', userRoutes);

// General Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

let server;
try {
  const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    ca: fs.readFileSync(process.env.SSL_CA_PATH)
  };
  server = https.createServer(sslOptions, app);
} catch (error) {
  console.error('Fatal: SSL configuration failed:', error);
  process.exit(1); // Exit if SSL fails in production
}

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Production server running on port ${port}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
