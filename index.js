const express = require('express');
const path = require('path');
const userRoutes = require('./rutas');
const bodyParser = require('body-parser');
const webPush = require('web-push'); // Añadido para notificaciones push
const https = require('https'); // Añadido para HTTPS
const fs = require('fs'); // Añadido para certificados SSL

const port = 3000;
const app = express();

// 1. Configuración VAPID para notificaciones push (AÑADIDO)
const vapidKeys = {
  publicKey: 'BC-d2euHb147bF7av1kpDwH84fswmN0_8zjODcQptU63P5q-FNVWa9Tuc_2GBofCc1SgDdbS8c_aHdDXiWfCYyo', // Reemplaza con tu clave
  privateKey: 'SbrIGm6fNYR3jW_-khzghnkOc-pGEWPZvzdchPIgp_U' // Reemplaza con tu clave
};

webPush.setVapidDetails(
  'mailto:tu-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vistas'));

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'publicos')));

// Configuración específica para PWA (MODIFICADO)
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Service-Worker-Allowed', '/'); // Añadido para mejor compatibilidad
  res.sendFile(path.join(__dirname, 'publicos/sw.js'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json'); // Añadido header correcto
  res.sendFile(path.join(__dirname, 'publicos/manifest.json'));
});

// Ruta para guardar suscripciones push (AÑADIDO)

// Rutas existentes
app.use('/', userRoutes);

// Configuración SSL (AÑADIDO)
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificados', 'cert.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certificados', 'cert.crt')),
  ca: fs.readFileSync(path.join(__dirname, 'certificados', 'ca.crt')),
  minVersion: 'TLSv1.2'
};

// Crear servidor HTTPS (MODIFICADO)
https.createServer(sslOptions, app).listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en https://0.0.0.0:${port}`);
  console.log('Clave pública VAPID para notificaciones:', vapidKeys.publicKey);
});

