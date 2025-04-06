const express = require('express');
const path = require('path');
const userRoutes = require('./rutas');
const webPush = require('web-push'); // Para notificaciones push
const https = require('https'); // Para HTTPS
const fs = require('fs'); // Para certificados SSL
const schedule = require('node-schedule'); // Para programar tareas
const os = require('os'); // Añadido para detectar IP local

const port = process.env.PORT || 3000;
const app = express();

// 1. Configuración VAPID para notificaciones push
const vapidKeys = {
  publicKey: 'BC-d2euHb147bF7av1kpDwH84fswmN0_8zjODcQptU63P5q-FNVWa9Tuc_2GBofCc1SgDdbS8c_aHdDXiWfCYyo',
  privateKey: 'SbrIGm6fNYR3jW_-khzghnkOc-pGEWPZvzdchPIgp_U'
};

webPush.setVapidDetails(
  'mailto:tu-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// 2. Inicialización de archivos
const suscripcionesPath = path.join(__dirname, 'publicos', 'suscripciones.json');
if (!fs.existsSync(suscripcionesPath)) {
    fs.writeFileSync(suscripcionesPath, '[]');
    console.log('Archivo de suscripciones creado');
}

// 3. Configuración básica de Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vistas'));

// 4. Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'publicos'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', `image/${path.split('.').pop()}`);
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// 5. Rutas específicas para PWA
app.get('/service-worker.js', (req, res) => {
  try {
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'publicos/service-worker.js'));
  } catch (error) {
    console.error('Error al servir el service worker:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.get('/manifest.json', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.join(__dirname, 'publicos/manifest.json'));
  } catch (error) {
    console.error('Error al servir el manifest:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// 6. Rutas de la aplicación
app.use('/', userRoutes);

// 7. Configuración SSL
let server;
try {
  const keyPath = path.join(__dirname, 'certificados', 'cert.key');
  const certPath = path.join(__dirname, 'certificados', 'cert.crt');
  const caPath = path.join(__dirname, 'certificados', 'ca.crt');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath) && fs.existsSync(caPath)) {
    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
      ca: fs.readFileSync(caPath)
    };
    server = https.createServer(sslOptions, app);
    console.log('Servidor HTTPS creado');
  } else {
    console.log('Certificados no encontrados, usando HTTP');
    server = require('http').createServer(app);
  }
} catch (error) {
  console.error('Error al configurar SSL:', error);
  server = require('http').createServer(app);
}

// 8. Programar notificaciones
const notificacionesPath = path.join(__dirname, 'publicos', 'notificaciones_programadas.json');
if (fs.existsSync(notificacionesPath)) {
  try {
    const notificaciones = JSON.parse(fs.readFileSync(notificacionesPath, 'utf-8'));
    
    notificaciones.forEach(notificacion => {
      const fechaNotificacion = new Date(notificacion.scheduledDateTime);
      
      // Verificar que la fecha no está en el pasado
      if (fechaNotificacion > new Date()) {
        console.log(`Programando notificación "${notificacion.title}" para:`, fechaNotificacion.toLocaleString());
        
        const job = schedule.scheduleJob(fechaNotificacion, async function() {
          try {
            console.log(`Enviando notificación programada: ${notificacion.title}`);
            
            // Leer suscripciones
            if (!fs.existsSync(suscripcionesPath)) {
              console.log('No hay suscripciones para enviar notificación');
              return;
            }

            const subscriptions = JSON.parse(await fs.promises.readFile(suscripcionesPath, 'utf-8'));
            if (subscriptions.length === 0) {
              console.log('No hay suscripciones para enviar notificación');
              return;
            }
            
            // Preparar el payload
            const payload = JSON.stringify({
              title: notificacion.title,
              body: notificacion.body,
              icon: notificacion.image || '/img/icon-192x192.png',
              badge: notificacion.image || '/img/icon-192x192.png',
              vibrate: [100, 50, 100],
              data: {
                dateOfArrival: Date.now(),
                primaryKey: notificacion.id || 1
              },
              actions: [{
                action: 'explore',
                title: 'Ver más'
              }]
            });

            // Enviar notificación a cada suscriptor
            for (const subscription of subscriptions) {
              try {
                await webPush.sendNotification(subscription, payload);
                console.log('Notificación enviada a:', subscription.endpoint);
              } catch (error) {
                console.error('Error al enviar notificación:', error);
              }
            }
          } catch (error) {
            console.error('Error al enviar notificación programada:', error);
          }
        });
      } else {
        console.log(`Notificación "${notificacion.title}" no programada: la fecha está en el pasado`);
      }
    });
  } catch (error) {
    console.error('Error al leer notificaciones programadas:', error);
  }
}

// 9. Iniciar servidor
// Iniciar servidor


app.listen(port, () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});

// 9. Iniciar servidor (VERSIÓN MODIFICADA PARA RED LOCAL)
/*const getNetworkIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const localIp = getNetworkIp();
const protocol = server.cert ? 'https' : 'http';

server.listen(port, '0.0.0.0', () => {
  console.log('\n=== Servidor iniciado correctamente ===');
  console.log(`- Acceso local: ${protocol}://localhost:${port}`);
  console.log(`- Acceso red local: ${protocol}://${localIp}:${port}`);
  if (server.cert) {
    console.log('\n⚠️ Si usas HTTPS con certificado auto-firmado:');
    console.log('En Chrome/Edge visita: chrome://flags/#allow-insecure-localhost');
    console.log('y habilita la opción "Allow invalid certificates for resources loaded from localhost"');
  }
});*/