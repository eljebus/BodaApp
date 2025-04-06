const fs = require('fs');
const path = require('path');
const webPush = require('web-push');
const cloudinary = require('cloudinary').v2;

const SUBS_FILE = path.join(__dirname, '..', 'publicos', 'suscripciones.json');
const VAPID_PUBLIC_KEY = 'BC-d2euHb147bF7av1kpDwH84fswmN0_8zjODcQptU63P5q-FNVWa9Tuc_2GBofCc1SgDdbS8c_aHdDXiWfCYyo';
const VAPID_PRIVATE_KEY = 'SbrIGm6fNYR3jW_-khzghnkOc-pGEWPZvzdchPIgp_U';

webPush.setVapidDetails('mailto:contacto@tudominio.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: 'drbrixx6j', 
  api_key: '567499117882323',        
  api_secret: 'uMvjfUSl13P3incKZ_oJGx9Mi1Q'
});

exports.index = async (req, res) => {
    res.render('layout', { title: 'Fatima & Jesus', content: 'index' });
};

exports.plan = async (req, res) => {
    res.render('layout', { title: 'Alumno', content: 'plan' });
};

exports.uploadFoto = async (req, res) => {
    console.log(req.file);
    res.status(200).send('OK');
};

exports.textos = async (req, res) => {
    try {
        const deseosPath = path.join(__dirname, '..', '/publicos/deseos.json');
        let deseos = [];

        if (fs.existsSync(deseosPath)) {
            const data = await fs.promises.readFile(deseosPath, 'utf-8');
            deseos = JSON.parse(data);
        }

        res.render('layout', { title: 'Alumno', content: 'textos', deseos });
    } catch (error) {
        console.error('Error al leer el archivo de deseos:', error);
        res.status(500).send('Error al cargar los textos');
    }
};

exports.saveText = async (req, res) => {
    try {
        const { nombre, deseo } = req.body;

        if (!nombre || !deseo) {
            return res.status(400).send('Nombre y deseo son requeridos');
        }

        const deseosPath = path.join(__dirname, '..', '/publicos/deseos.json');
        let deseos = [];

        if (fs.existsSync(deseosPath)) {
            const data = await fs.promises.readFile(deseosPath, 'utf-8');
            deseos = JSON.parse(data);
        }

        deseos.push({ nombre, deseo, fecha: new Date().toISOString() });
        await fs.promises.writeFile(deseosPath, JSON.stringify(deseos, null, 2));

        res.status(200).send('Deseo guardado exitosamente');
    } catch (error) {
        console.error('Error al guardar el deseo:', error);
        res.status(500).send('Error al guardar el deseo');
    }
};

// Función para guardar la suscripción push
exports.savePushSubscription = async (req, res) => {
    try {
        const subscription = req.body;
        console.log('Recibida suscripción:', subscription);

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ error: 'Suscripción inválida' });
        }

        let subscriptions = [];
        try {
            if (!fs.existsSync(SUBS_FILE)) {
                fs.writeFileSync(SUBS_FILE, JSON.stringify([], null, 2));
            }

            const fileContent = fs.readFileSync(SUBS_FILE, 'utf8');
            subscriptions = JSON.parse(fileContent);
        } catch (error) {
            console.error('Error al leer o parsear archivo:', error);
            subscriptions = [];
        }

        if (subscriptions.some(sub => sub.endpoint === subscription.endpoint)) {
            return res.status(200).json({ message: 'Suscripción ya existe', subscription });
        }

        subscriptions.push(subscription);
        fs.writeFileSync(SUBS_FILE, JSON.stringify(subscriptions, null, 2));

        const payload = JSON.stringify({
            title: 'Bienvenido',
            body: '¡Gracias por suscribirte a las notificaciones!',
            icon: '/img/icon-192x192.png',
            badge: '/img/luna.png'
        });

        await webPush.sendNotification(subscription, payload);
        res.status(200).json({ message: 'Suscripción guardada correctamente', subscription });
    } catch (error) {
        console.error('Error al guardar suscripción:', error);
        res.status(500).json({ error: 'Error al guardar la suscripción', details: error.message });
    }
};

// Función para enviar notificaciones push a todos los suscriptores
exports.sendPushToAll = async (req, res) => {
    try {
        const { title, body } = req.body;
        if (!title || !body) return res.status(400).json({ error: 'Se requieren título y cuerpo' });

        if (!fs.existsSync(SUBS_FILE)) return res.status(404).json({ error: 'No hay suscriptores activos' });

        let fileContent;
        try {
            fileContent = fs.readFileSync(SUBS_FILE, 'utf8');
        } catch (error) {
            return res.status(500).json({ error: 'Error al leer archivo de suscripciones' });
        }

        let subscriptions;
        try {
            subscriptions = JSON.parse(fileContent);
            if (!Array.isArray(subscriptions)) throw new Error('Formato inválido');
        } catch (error) {
            return res.status(500).json({ error: 'Formato inválido de suscripciones' });
        }

        if (!subscriptions.length) return res.status(404).json({ error: 'No hay suscriptores activos' });

        const payload = JSON.stringify({
            title,
            body,
            icon: '/img/icon-192x192.png',
            badge: '/img/luna.png',
            vibrate: [100, 50, 100],
            actions: [{ action: 'explore', title: 'Ver más' }]
        });

        const results = await Promise.allSettled(subscriptions.map(async (subscription) => {
            try {
                console.log('Enviando notificación a:', subscription.endpoint);
                // Verifica si la suscripción es válida antes de enviar la notificación 
                await webPush.sendNotification(subscription, payload);
                return { success: true, endpoint: subscription.endpoint };
            } catch (error) {
                return { success: false, endpoint: subscription.endpoint, error: error.message };
            }
        }));

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
        const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success);

        res.status(200).json({
            message: 'Notificaciones enviadas',
            total: subscriptions.length,
            successful: successful.length,
            failed: failed.length,
            details: { successful: successful.map(r => r.value.endpoint), failed: failed.map(r => r.value.endpoint) }
        });
    } catch (error) {
        console.error('Error al enviar notificaciones:', error);
        res.status(500).json({ error: 'Error al enviar notificaciones', details: error.message });
    }
};

exports.album = async (req, res) => {
    try {
        const result = await cloudinary.search
            .expression('folder:Fotos')
            .sort_by('created_at', 'desc')
            .max_results(60)
            .execute();

        let fotos = result.resources.map(img => img.secure_url);

        if (req.query.nueva && !fotos.includes(req.query.nueva)) {
            fotos.unshift(req.query.nueva);
        }

        res.render('layout', { title: 'Alumno', content: 'album', fotos });
    } catch (error) {
        console.error('Error al obtener imágenes desde Cloudinary:', error);
        res.status(500).send('Error cargando el álbum');
    }
};

// Función para verificar si una suscripción existe en el servidor
exports.checkSubscription = async (req, res) => {
    try {
        if (!fs.existsSync(SUBS_FILE)) return res.json({ exists: false, message: 'No hay archivo de suscripciones' });

        const fileContent = fs.readFileSync(SUBS_FILE, 'utf8');
        const subscriptions = JSON.parse(fileContent);

        const hasValidSubscriptions = Array.isArray(subscriptions) && subscriptions.length > 0 &&
            subscriptions.some(sub => sub && sub.endpoint && sub.keys && Object.keys(sub.keys).length > 0);

        res.json({
            exists: hasValidSubscriptions,
            count: subscriptions.length,
            message: hasValidSubscriptions ? `Hay ${subscriptions.length} suscripciones activas` : 'No hay suscripciones activas'
        });
    } catch (error) {
        console.error('Error al verificar suscripción:', error);
        res.status(500).json({ error: 'Error al verificar suscripción', details: error.message });
    }
};

exports.notificaciones = async (req, res) => {
    res.render('layout', { title: 'Enviar Notificaciones', content: 'notificaciones' });
};
