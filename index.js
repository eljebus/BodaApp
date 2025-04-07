const https = require('https');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const webPush = require('web-push');
const schedule = require('node-schedule');
const fs = require('fs');
const userRoutes = require('./rutas');

const app = express();
const port = 3000; // Puerto fijo para entorno local

// Configuración VAPID para entorno local
const vapidKeys = {
  publicKey: 'BC-d2euHb147bF7av1kpDwH84fswmN0_8zjODcQptU63P5q-FNVWa9Tuc_2GBofCc1SgDdbS8c_aHdDXiWfCYyo',
  privateKey: 'SbrIGm6fNYR3jW_-khzghnkOc-pGEWPZvzdchPIgp_U'
};

webPush.setVapidDetails(
  'mailto:local@example.com', // Correo genérico para pruebas locales
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

      // Verificación de suscripción
      if (!suscripcion || !suscripcion.endpoint) {
        console.error('Suscripción inválida, no tiene endpoint.');
        return; // Si no tiene endpoint, no intentamos enviar la notificación.
      }

      schedule.scheduleJob(new Date(fecha), () => {
        const payload = JSON.stringify({ title: 'Notificación', body: mensaje });

        // Enviar notificación
        webPush.sendNotification(suscripcion, payload)
          .then(response => {
            console.log('Notificación enviada correctamente:', response);
          })
          .catch(err => {
            console.error('Error al enviar la notificación:', err);
            console.error('Suscripción:', suscripcion);
          });
      });
    });
    console.log('Tareas programadas registradas correctamente.');
  } else {
    console.error('El archivo @notificaciones_programadas.json no existe.');
  }
};

programarNotificaciones();


app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
/*
// Cargar certificados SSL desde la carpeta certificados
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificados', 'cert.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certificados', 'cert.crt')),
  ca: fs.readFileSync(path.join(__dirname, 'certificados', 'ca.crt'))
};

// ¡Aquí es donde debes escuchar!
https.createServer(sslOptions, app).listen(port, () => {
  console.log(`Servidor corriendo en https://localhost:${port}`);
});*/
