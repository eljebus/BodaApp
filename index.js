const express = require('express');
const path = require('path');
const userRoutes = require('./rutas');
const bodyParser = require('body-parser');
const webPush = require('web-push');

const port = process.env.PORT || 3000;
const app = express();

// Configuración VAPID para notificaciones push
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

// Configuración específica para PWA
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, 'publicos/sw.js'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'publicos/manifest.json'));
});

// Ruta para guardar suscripciones push
// Aquí deberías agregar la ruta para manejar la suscripción a notificaciones

// Rutas existentes
app.use('/', userRoutes);

// Iniciar servidor HTTP (sin HTTPS)
app.listen(port, () => {
  console.log(`Servidor HTTP corriendo en http://localhost:${port}`);
});
