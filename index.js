const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const userRoutes = require('./rutas');

const app = express();
const port = process.env.PORT || 3000;

// Configuración VAPID para notificaciones push
const vapidKeys = {
  publicKey: 'BC-d2euHb147bF7av1kpDwH84fswmN0_8zjODcQptU63P5q-FNVWa9Tuc_2GBofCc1SgDdbS8c_aHdDXiWfCYyo',
  privateKey: 'SbrIGm6fNYR3jW_-khzghnkOc-pGEWPZvzdchPIgp_U'
};

webPush.setVapidDetails(
  'mailto:tu-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Middlewares necesarios
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vistas'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'publicos')));

// Rutas PWA
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, 'publicos/sw.js'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'publicos/manifest.json'));
});

// Tus rutas
app.use('/', userRoutes);

// Servidor HTTP (Railway ya hace HTTPS)
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Servidor corriendo en http://0.0.0.0:${port}`);
  console.log(`🔑 VAPID pública: ${vapidKeys.publicKey}`);
});
