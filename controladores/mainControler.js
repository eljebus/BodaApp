const fs = require('fs');
const path = require('path');

const webPush = require('web-push');
const SUBS_FILE = path.join(__dirname, '..', 'publicos', 'suscripciones.json');

// Configuración VAPID (debes reemplazar con tus claves reales)
webPush.setVapidDetails(
  'mailto:contacto@tudominio.com',
  'BC-d2euHb147bF7av1kpDwH84fswmN0_8zjODcQptU63P5q-FNVWa9Tuc_2GBofCc1SgDdbS8c_aHdDXiWfCYyo',
  'SbrIGm6fNYR3jW_-khzghnkOc-pGEWPZvzdchPIgp_U'
);

const cloudinary = require('cloudinary').v2;

// Asegúrate de haber configurado Cloudinary previamente
cloudinary.config({
    cloud_name: 'drbrixx6j',  // Reemplaza con tu Cloud Name
    api_key: '567499117882323',        // Reemplaza con tu API Key
    api_secret: 'uMvjfUSl13P3incKZ_oJGx9Mi1Q'   // Reemplaza con tu API Secret
  });

// ... (imports se mantienen igual)

exports.index = async (req, res) => {
    res.render('layout', { 
        title   : 'Fatima & Jesus', 
        content : 'index'
    });
};

exports.plan = async (req, res) => {
    res.render('layout', { 
        title   : 'Alumno', 
        content : 'plan'
    });
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

        res.render('layout', { 
            title   : 'Alumno', 
            content : 'textos',
            deseos  : deseos
        });
    } catch (error) {
        console.error('Error al leer el archivo de deseos:', error);
        res.status(500).send('Error al cargar los textos');
    }
};

exports.saveText = async (req, res) => {
    console.log(req.body);
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

        // Add the new entry
        deseos.push({ nombre, deseo, fecha: new Date().toISOString() });

        // Save the updated list back to the file
        await fs.promises.writeFile(deseosPath, JSON.stringify(deseos, null, 2));

        res.status(200).send('Deseo guardado exitosamente');
    } catch (error) {
        console.error('Error al guardar el deseo:', error);
        res.status(500).send('Error al guardar el deseo');
    }
};

// Función para guardar suscripciones push
exports.savePushSubscription = async (req, res) => {
    try {
        console.log('Recibida solicitud de guardar suscripción');
        console.log('Ruta del archivo:', SUBS_FILE);
        
        const subscription = req.body;
        console.log('Suscripción recibida:', subscription);
        
        let subscriptions = [];
        
        // Asegurarse de que el directorio existe
        const dir = path.dirname(SUBS_FILE);
        if (!fs.existsSync(dir)) {
            console.log('Creando directorio:', dir);
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Leer suscripciones existentes si el archivo existe
        if (fs.existsSync(SUBS_FILE)) {
            console.log('Archivo de suscripciones encontrado');
            try {
                const data = await fs.promises.readFile(SUBS_FILE, 'utf-8');
                subscriptions = JSON.parse(data);
                console.log('Suscripciones existentes:', subscriptions.length);
            } catch (error) {
                console.error('Error al leer el archivo de suscripciones:', error);
                // Si hay error al leer, creamos un nuevo array
                subscriptions = [];
            }
        } else {
            console.log('Archivo de suscripciones no encontrado, se creará uno nuevo');
            // Crear el archivo con un array vacío
            await fs.promises.writeFile(SUBS_FILE, '[]', 'utf-8');
        }

        // Verificar si la suscripción ya existe
        const exists = subscriptions.some(sub => sub.endpoint === subscription.endpoint);
        if (!exists) {
            // Agregar la nueva suscripción
            subscriptions.push(subscription);
            
            // Guardar todas las suscripciones
            await fs.promises.writeFile(SUBS_FILE, JSON.stringify(subscriptions, null, 2), 'utf-8');
            console.log('Nueva suscripción guardada:', subscription.endpoint);
            console.log('Total de suscripciones:', subscriptions.length);
        } else {
            console.log('Suscripción ya existe:', subscription.endpoint);
        }

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error al guardar la suscripción:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Error al guardar la suscripción' });
    }
};

// Función para enviar notificaciones push
exports.sendPushToAll = async (req, res) => {
    try {
        const { title, body, icon, badge, image } = req.body;
        
        if (!title || !body) {
            return res.status(400).json({ error: 'Título y cuerpo son requeridos' });
        }

        if (!fs.existsSync(SUBS_FILE)) {
            return res.status(404).json({ error: 'No hay suscripciones guardadas' });
        }

        const subscriptions = JSON.parse(await fs.promises.readFile(SUBS_FILE, 'utf-8'));
        const results = [];

        for (const subscription of subscriptions) {
            try {
                const payload = JSON.stringify({
                    title: title,
                    body: body,
                    icon: icon || '/img/icon-192x192.png',
                    badge: badge || '/img/icon-192x192.png',
                    image: image,
                    vibrate: [100, 50, 100],
                    data: {
                        dateOfArrival: Date.now(),
                        primaryKey: 1
                    },
                    actions: [{
                        action: 'explore',
                        title: 'Ver más'
                    }]
                });

                await webPush.sendNotification(subscription, payload);
                results.push({ success: true, endpoint: subscription.endpoint });
            } catch (error) {
                console.error('Error al enviar notificación:', error);
                results.push({ success: false, endpoint: subscription.endpoint, error: error.message });
            }
        }

        res.json({
            message: 'Notificaciones enviadas',
            results: results
        });
    } catch (error) {
        console.error('Error general al enviar notificaciones:', error);
        res.status(500).json({ error: 'Error al enviar notificaciones' });
    }
};


  
exports.album = async (req, res) => {
  try {
    // Buscar todas las imágenes en la carpeta 'fotos'
    const result = await cloudinary.search
      .expression('folder:Fotos') // carpeta en Cloudinary
      .sort_by('created_at', 'desc')
      .max_results(60) // puedes ajustar esto
      .execute();

    const fotos = result.resources.map(img => img.secure_url);

    res.render('layout', {
      title: 'Alumno',
      content: 'album',
      fotos: fotos
    });

  } catch (error) {
    console.error('Error al obtener imágenes desde Cloudinary:', error);
    res.status(500).send('Error cargando el álbum');
  }
};

// Función para verificar si una suscripción existe en el servidor
exports.checkSubscription = async (req, res) => {
    try {
        const subscription = req.body;
        
        if (!fs.existsSync(SUBS_FILE)) {
            return res.status(404).json({ exists: false });
        }

        const subscriptions = JSON.parse(await fs.promises.readFile(SUBS_FILE, 'utf-8'));
        const exists = subscriptions.some(sub => sub.endpoint === subscription.endpoint);

        res.json({ exists });
    } catch (error) {
        console.error('Error al verificar suscripción:', error);
        res.status(500).json({ error: 'Error al verificar suscripción' });
    }
};

exports.notificaciones = async (req, res) => {
    res.render('layout', { 
        title: 'Enviar Notificaciones',
        content: 'notificaciones'
    });
};

