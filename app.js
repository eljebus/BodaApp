const express = require('express');
const path = require('path');
const webPush = require('web-push');
const fs = require('fs');
const rutas = require('./rutas');

const app = express();

// Configuración de web-push
const vapidKeys = {
    publicKey: 'BC-d2euHb147bF7av1kpDwH84fswmN0_8zjODcQptU63P5q-FNVWa9Tuc_2GBofCc1SgDdbS8c_aHdDXiWfCYyo',
    privateKey: 'uJ_YwYYZRwG_vuGNjUjqG5Cc_FoVqwF8_Ao2j8Lu0Hs'
};

webPush.setVapidDetails(
    'mailto:jesus.martinez.castro.47@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vistas'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'publicos')));

// Rutas
app.use('/', rutas);

// Crear directorio para suscripciones si no existe
const subsDir = path.join(__dirname, 'data');
if (!fs.existsSync(subsDir)) {
    fs.mkdirSync(subsDir, { recursive: true });
}

// Crear archivo de suscripciones si no existe
const subsFile = path.join(subsDir, 'suscripciones.json');
if (!fs.existsSync(subsFile)) {
    fs.writeFileSync(subsFile, '[]', 'utf8');
}

// Puerto
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
}); 