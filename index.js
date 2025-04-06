const express = require('express');
const path = require('path');
const userRoutes = require('./rutas');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const https = require('https');
const fs = require('fs');
const helmet = require('helmet'); // Añadido para seguridad

// Use environment variables for sensitive data
const port = process.env.PORT || 3000;
const app = express();

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

// Security middleware
app.use(helmet());
app.use(bodyParser.json({ limit: '10kb' })); // Limit payload size
app.use(bodyParser.urlencoded({ extended: true, limit: '10kb' }));

// Production settings
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vistas'));

// Cache static files in production
const cacheTime = process.env.NODE_ENV === 'production' ? 86400000 : 0;
app.use(express.static(path.join(__dirname, 'publicos'), {
  maxAge: cacheTime,
  etag: true
}));

app.get('/service-worker.js', (req, res) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, 'publicos/sw.js'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'publicos/manifest.json'));
});

app.use('/', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// SSL configuration with proper path handling
const sslOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH || path.join(__dirname, 'certificados', 'cert.key')),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH || path.join(__dirname, 'certificados', 'cert.crt')),
  ca: fs.readFileSync(process.env.SSL_CA_PATH || path.join(__dirname, 'certificados', 'ca.crt')),
  minVersion: 'TLSv1.2'
};

// Start server
const server = https.createServer(sslOptions, app);
server.listen(port, '0.0.0.0', () => {
  console.log(`Production server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
