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

// 2. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'publicos')));

// 3. Configuración de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vistas'));

// 4. Registrar rutas
app.use('/', userRoutes);

// 5. Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

// 6. Configuración SSL
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

// 7. Iniciar servidor
const getNetworkIp = () => {
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

const networkIp = '0.0.0.0'; // Listen on all available network interfaces
server.listen(port, networkIp, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
  console.log(`IP local: ${getNetworkIp()}`);
});
