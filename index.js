const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const schedule = require('node-schedule');
const fs = require('fs');
const userRoutes = require('./rutas');

const app = express();
const port = process.env.PORT || 3000;

// Configuración VAPID
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BC-d2euHb147bF7av1kpDwH84fswmN0_8zjODcQptU63P5q-FNVWa9Tuc_2GBofCc1SgDdbS8c_aHdDXiWfCYyo',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'SbrIGm6fNYR3jW_-khzghnkOc-pGEWPZvzdchPIgp_U'
};

webPush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:tu-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vistas'));

app.use(express.static(path.join(__dirname, 'publicos')));

// Service Worker y Manifest
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, 'publicos/sw.js'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'publicos/manifest.json'));
});

// Rutas de tu app
app.use('/', userRoutes);

// Registrar tareas programadas
const programarNotificaciones = () => {
  const filePath = path.join(__dirname, 'publicos/notificaciones_programadas.json');
  if (fs.existsSync(filePath)) {
    const tareas = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    tareas.forEach(tarea => {
      const { fecha, mensaje, suscripcion } = tarea;
      schedule.scheduleJob(new Date(fecha), () => {
        const payload = JSON.stringify({ title: 'Notificación', body: mensaje });
        webPush.sendNotification(suscripcion, payload).catch(err => {
          console.error('Error al enviar notificación:', err);
        });
      });
    });
    console.log('Tareas programadas registradas correctamente.');
  } else {
    console.error('El archivo @notificaciones_programadas.json no existe.');
  }
};

programarNotificaciones();

// ¡Aquí es donde debes escuchar!
app.listen(port, () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
